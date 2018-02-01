import * as React from 'react';
import * as Bacon from 'baconjs';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import UserSelector from '../component/user-selector';
import Checkbox from 'material-ui/Checkbox';
import UserAvatar from '../component/user-avatar';
import * as arrays from '../../../shared/util/Arrays';
import Money from '../../../shared/util/Money';
import * as categories from  '../../data/Categories';
import * as apiConnect from '../../data/ApiConnect';
import * as state from '../../data/State';
import * as time from '../../../shared/util/Time';
import { KeyCodes } from '../../util/Io'
import { SumField, TypeSelector, TitleField, CategorySelector, SourceSelector, DateField, ReceiverField, DescriptionField } from './expense-dialog-components';
import { expenseName } from './expense-helper';
import { unsubscribeAll } from '../../util/ClientUtil';
import { stopEventPropagation } from '../../util/ClientUtil';
import * as moment from 'moment';
import { splitByShares, negateDivision } from '../../../shared/util/Splitter';
const debug = require('debug')('bookkeeper:expense-dialog');

function findParentCategory(categoryId) {
    const map = state.get("categoryMap");
    let current = map[categoryId];
    while (current && current.parentId > 0) {
        current = map[current.parentId];
    }
    return current ? current.id : undefined;
}

function errorIf(condition, error) {
    return condition ? error : undefined;
}

function getDefaultSourceId() {
    return state.get("group").defaultSourceId;
}

function getDefaultSourceUsers() {
    const sId = getDefaultSourceId();
    const source = state.get("sourceMap")[sId];
    return source && source.users.map(u => u.userId) || [state.get("user").id];
}

/*
 * default: default value
 * read: (expense item) => value; read value from existing expense item
 * parse: (input) => value; convert user-entered input into value
 * validate: (value) => error or undefined; check if parsed value is valid or not
 */
const fields = {
    "title": { default: "", validate: v => errorIf(v.length < 1, "Nimi puuttuu") },
    "sourceId": { default: getDefaultSourceId, validate: v => errorIf(!v, "Lähde puuttuu") },
    "categoryId": { default: 0, read: (e) => findParentCategory(e.categoryId), validate: v => errorIf(!v, "Kategoria puuttuu") },
    "subcategoryId": { default: 0, read: (e) => e.categoryId },
    "receiver": { default: "", validate: v => errorIf(v.length < 1, "Kohde puuttuu") },
    "sum": { default: "", parse: v => v.replace(/,/, "."), validate: v => errorIf(v.length == 0, "Summa puuttuu") || errorIf(v.match(/^[0-9]+([.][0-9]{1,2})?$/) == null, "Summa on virheellinen") },
    "userId": { default: () => state.get("user").id, read: (e) => e.userId },
    "date": { default: () => moment().toDate(), read: (e) => time.fromDate(e.date).toDate() },
    "benefit": { default: getDefaultSourceUsers,
        read: (e) => e.division.filter(d => d.type === (e.type === "expense" ? "benefit" : "split")).map(d => d.userId),
        validate: (v) => errorIf(v.length < 1, "Jonkun pitää hyötyä") },
    "description": { default: "", read: (e) => e.description || "" },
    "id": { default: undefined, read: e => e ? e.id : undefined },
    "confirmed": { default: true },
    "type": { default: "expense" }
};

const defaultCategory = [ { id: 0, name: "Kategoria" }];
const defaultSubcategory = [ { id: 0, name: "Alikategoria" }];

function initValue(name, expense?: any) {
    if (expense === undefined) {
        const def = fields[name].default;
        return typeof def === "function" ? def() : def;
    }
    const convert = fields[name].read;
    return typeof convert === "function" ? convert(expense) : expense[name];
}

function calculateCost(sum, sourceId, benefit) {
    const sourceUsers = state.get("sourceMap")[sourceId].users;
    const sourceUserIds = sourceUsers.map(s => s.userId);
    const benefitUserIds = benefit.map(b => b.userId);
    if (arrays.sortAndCompareElements(sourceUserIds, benefitUserIds)) {
        // Create cost based on benefit calculation
        debug("Source has same users than who benefit; creating benefit based on cost");
        return negateDivision(benefit);
    }
    // Calculate cost manually
    debug("Calculating cost by source users");
    return negateDivision(splitByShares(sum, sourceUsers));
}

function allTrue() {
    return Array.prototype.slice.call(arguments).reduce((a, b) => a && b, true);
}

function fixItem(type) {
    return (item) => {
        item.sum = item.sum.toString();
        item.type = type;
        return item;
    }
}

function calculateDivision(expense, sum) {
    if (expense.type === "expense") {
        const benefit = splitByShares(sum, expense.benefit.map(id => ({ userId: id, share: 1 })));
        const cost = calculateCost(sum, expense.sourceId, benefit);
        return benefit.map(fixItem("benefit")).concat(cost.map(fixItem("cost")));
    } else {
        const income = [{ userId: expense.userId, sum: sum }];
        const split = negateDivision(splitByShares(sum, expense.benefit.map(id => ({ userId: id, share: 1 }))));
        return income.map(fixItem("income")).concat(split.map(fixItem("split")));
    }
}

export default class ExpenseDialog extends React.Component<any, any> {

    private saveLock: Bacon.Bus<any, any>;
    private inputStreams: any;
    private submitStream: any;
    private unsub: any;
    private categories: any;
    private sources: any;
    private categorySource: any;
    private moneyInput: any;
    public state: any;

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            createNew: true,
            subcategories: defaultSubcategory,
            valid: false,
            errors: {}
        };
        this.saveLock = new Bacon.Bus();
        this.inputStreams = {};
        this.submitStream = new Bacon.Bus();
        Object.keys(fields).forEach(k => {
            this.state[k] = initValue(k);
        });
        this.updateCategoriesAndSources();
        this.closeDialog = this.closeDialog.bind(this);
        this.requestSave = this.requestSave.bind(this);
        this.setCategory = this.setCategory.bind(this);
        this.selectCategory = this.selectCategory.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
    }

    componentDidMount() {
        this.unsub = [];
        this.unsub.push(state.get("expenseDialogStream").onValue(e => this.handleOpen(e)));

        this.inputStreams = {};
        this.submitStream = new Bacon.Bus();
        this.unsub.push(this.submitStream);
        Object.keys(fields).forEach(k => {
            this.inputStreams[k] = new Bacon.Bus();
            this.unsub.push(this.inputStreams[k]);
        });

        const validity = {};
        const values: any = {};
        Object.keys(fields).forEach(k => {
            const info = fields[k];
            this.inputStreams[k].onValue(v => this.setState({ [k]: v }));
            const parsed = info.parse ? this.inputStreams[k].map(info.parse) : this.inputStreams[k];
            values[k] = parsed;
            const error = info.validate ? parsed.map(info.validate) : Bacon.constant(undefined);
            error.onValue(e => this.setState(s => ({ errors: Object.assign({}, s.errors, { [k]: e }) })));
            const isValid = error.map(v => v === undefined);
            validity[k] = isValid;
        });
        values.categoryId.onValue(id => {
            const map = state.get("categoryMap");
            this.setState({ subcategories: defaultSubcategory.concat(id ? map[id].children || [] : []) });
        });
        Bacon.combineAsArray(values.categoryId, values.subcategoryId).onValue(a => {
            if (a[1] > 0 && !categories.isSubcategoryOf(a[1], a[0])) this.inputStreams.subcategoryId.push(0);
        });
        values.id.onValue(v => this.setState({ createNew: v === undefined }));
        values.sourceId.onValue(v => this.inputStreams.benefit.push(state.get("sourceMap")[v].users.map(u => u.userId)));

        const allValid = Bacon.combineWith(allTrue, Object.keys(fields).map(k => validity[k]));
        allValid.onValue(v => this.setState({ valid: v }));
        const expense = Bacon.combineTemplate(values);

        Bacon.combineWith((e, v, h) => Object.assign(e, { allValid: v && !h }), expense, allValid, this.saveLock.toProperty(false))
            .sampledBy(this.submitStream)
            .filter(e => e.allValid)
            .onValue(e => this.saveExpense(e));
    }

    componentWillUnmount() {
        unsubscribeAll(this.unsub);
    }

    updateCategoriesAndSources() {
        const cats = state.get("categories");
        this.categories = defaultCategory.concat(cats);
        this.sources = state.get("sources");
        this.categorySource = categories.getDataSource();
    }

    handleOpen(expense) {
        debug("Open expense", expense);
        this.updateCategoriesAndSources();
        Object.keys(fields).forEach(k => this.inputStreams[k].push(initValue(k, expense)));
        this.setState({ open: true }, () => this.moneyInput && this.moneyInput.focus());
    }

    closeDialog() {
        debug("Closing dialog");
        this.setState({ open: false });
        return false;
    }

    requestSave(event) {
        this.submitStream.push(true);
        event.preventDefault();
        event.stopPropagation();
    }

    saveExpense(expense) {
        debug("Save", expense);
        const createNew = !expense.id;
        const sum = Money.from(expense.sum);
        const division = calculateDivision(expense, sum);
        const data = Object.assign({}, expense, {
            division: division,
            date: time.date(expense.date),
            categoryId: expense.subcategoryId ? expense.subcategoryId : expense.categoryId,
        });

        delete data.id;
        delete data.subcategoryId;
        delete data.allValid;
        const name = expenseName(data);
        this.saveLock.push(true);
        (createNew ? apiConnect.storeExpense(data) : apiConnect.updateExpense(expense.id, data))
            .then(e => {
                this.saveLock.push(false);
                state.get("expensesUpdatedStream").push(expense.date);
                this.closeDialog();
                state.notify(`${createNew ? "Tallennettu" : "Päivitetty"} ${name}`);
                return null;
            })
            .catch(e => {
                this.saveLock.push(false);
                state.notifyError(`Virhe ${createNew ? "tallennettaessa" : "päivitettäessä"} kirjausta ${name}`, e);
                return null;
            });
    }

    selectCategory(id) {
        const m = state.get("categoryMap");
        const name = m[id].name;
        if (m[id].parentId) {
            this.setCategory(m[id].parentId, id);
        } else {
            this.setCategory(id, 0);
        }
        this.inputStreams.title.push(name);
    }

    setCategory(id, subcategoryId) {
        this.inputStreams.categoryId.push(id);
        this.inputStreams.subcategoryId.push(subcategoryId);
    }

    handleKeyPress(event) {
        const code = event.keyCode;
        if (code === KeyCodes.escape) {
            return this.closeDialog();
        }
    }

    render() {
        const actions = [
            <FlatButton
                label="Peruuta"
                primary={true}
                onClick={this.closeDialog} />,
            <FlatButton
                label="Tallenna"
                primary={true}
                disabled={!this.state.valid}
                keyboardFocused={true}
                onClick={this.requestSave} />
        ];

        return <Dialog
                    contentClassName="expense-dialog"
                    bodyClassName="expense-dialog-body"
                    title={ this.state.createNew ? "Uusi kirjaus" : "Muokkaa kirjausta" }
                    actions={actions}
                    modal={true}
                    autoDetectWindowHeight={true}
                    autoScrollBodyContent={true}
                    open={this.state.open}
                    onRequestClose={this.closeDialog}>
            <form onSubmit={this.requestSave} onKeyUp={this.handleKeyPress}>
                <div>
                    <UserAvatar userId={this.state.userId} style={{ verticalAlign: "middle" }} />
                    <div className="expense-sum" style={{ height: "72px", marginLeft: "2em", display: "inline-block", verticalAlign: "middle" }}>
                        <SumField value={this.state.sum} errorText={this.state.errors.sum}
                                  theRef={r => this.moneyInput = r}
                                  onChange={v => this.inputStreams.sum.push(v)} />
                    </div>
                    <div className="expense-confirmed" style={{ marginLeft: "2em", display: "inline-block", verticalAlign: "middle" }}>
                        <Checkbox label="Alustava" checked={!this.state.confirmed} onCheck={(e,v) => this.inputStreams.confirmed.push(!v)}/>
                    </div>
                    <div className="expense-type" style={{ marginLeft: "2em", display: "inline-block", verticalAlign: "middle" }}>
                        <TypeSelector value={this.state.type} onChange={v => this.inputStreams.type.push(v)} />
                    </div>
                </div>
                <TitleField
                    value={this.state.title}
                    onSelect={this.selectCategory}
                    dataSource={this.categorySource}
                    errorText={this.state.errors.title}
                    onChange={v => this.inputStreams.title.push(v)}
                />
                <ReceiverField value={this.state.receiver} onChange={v => this.inputStreams.receiver.push(v)}
                               errorText={this.state.errors.receiver} onKeyUp={stopEventPropagation}/>
                <CategorySelector
                    category={this.state.categoryId} categories={this.categories}
                    onChangeCategory={v => this.inputStreams.categoryId.push(v)}
                    errorText={this.state.errors.categoryId}
                    subcategory={this.state.subcategoryId} subcategories={this.state.subcategories}
                    onChangeSubcategory={v => this.inputStreams.subcategoryId.push(v)} />
                <br />
                <div style={{ display: "flex", flexWrap: "nowrap" }}>
                    <SourceSelector
                        value={this.state.sourceId} sources={this.sources} style={{ flexGrow: "1" }}
                        onChange={v => this.inputStreams.sourceId.push(v)} />
                    <UserSelector style={{ paddingTop: "0.5em" }} selected={this.state.benefit}
                                  onChange={v => this.inputStreams.benefit.push(v)} />
                </div>
                <br />

                <DateField value={this.state.date} onChange={v => this.inputStreams.date.push(v)} />
                <DescriptionField value={this.state.description} onChange={v => this.inputStreams.description.push(v)}
                                  errorText={this.state.errors.description} />
            </form>
        </Dialog>
    }
}
