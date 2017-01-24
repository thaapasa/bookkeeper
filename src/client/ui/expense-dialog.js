"use strict";
import React from 'react';
import * as Bacon from "baconjs";
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import UserSelector from "./user-selector";
import UserAvatar from "./user-avatar";
import * as arrays from "../../shared/util/arrays";
import * as splitter from "../../shared/util/splitter";
import Money from "../../shared/util/money";
import * as categories from  "../data/categories";
import * as apiConnect from "../data/api-connect";
import * as state from "../data/state";
import * as time from "../../shared/util/time";
import {SumField, DescriptionField, CategorySelector, SourceSelector, DateField, ReceiverField} from "./expense-dialog-components";
const moment = require("moment");

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

/*
 * default: default value
 * read: (expense item) => value; read value from existing expense item
 * parse: (input) => value; convert user-entered input into value
 * validate: (value) => error or undefined; check if parsed value is valid or not
 */
const fields = {
    "description": { default: "", validate: v => errorIf(v.length < 1, "Selite puuttuu") },
    "sourceId": { default: () => state.get("group").defaultSourceId, validate: v => errorIf(!v, "Lähde puuttuu") },
    "categoryId": { default: 0, read: (e) => findParentCategory(e.categoryId), validate: v => errorIf(!v, "Kategoria puuttuu") },
    "subcategoryId": { default: 0, read: (e) => e.categoryId },
    "receiver": { default: "", validate: v => errorIf(v.length < 1, "Kohde puuttuu") },
    "sum": { default: "", parse: v => v.replace(/,/, "."), validate: v => errorIf(v.length == 0, "Summa puuttuu") || errorIf(v.match(/^[0-9]+([.][0-9]{1,2})?$/) == null, "Summa on virheellinen") },
    "userId": { default: () => state.get("user").id, read: (e) => e.userId },
    "date": { default: () => moment().toDate(), read: (e) => time.fromDate(e.date).toDate() },
    "benefit": { default: () => [state.get("user").id], read: (e) => e.division.filter(d => d.type === "benefit").map(d => d.userId),
        validate: (v) => errorIf(v.length < 1, "Jonkun pitää hyötyä") },
    "id": { default: undefined, read: e => e ? e.id : undefined }
};

const defaultCategory = [ { id: 0, name: "Kategoria" }];
const defaultSubcategory = [ { id: 0, name: "Alikategoria" }];

function initValue(name, expense) {
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
        console.log("Source has same users than who benefit; creating benefit based on cost");
        return splitter.negateDivision(benefit);
    }
    // Calculate cost manually
    console.log("Calculating cost by source users");
    return splitter.negateDivision(splitter.splitByShares(sum, sourceUsers));
}

function allTrue() {
    return Array.prototype.slice.call(arguments).reduce((a, b) => a && b, true);
}

export default class ExpenseDialog extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            createNew: true,
            subcategories: defaultSubcategory,
            valid: false,
            errors: {}
        };
        this.inputStreams = {};
        this.submitStream = new Bacon.Bus();
        Object.keys(fields).forEach(k => {
            this.state[k] = initValue(k);
            this.inputStreams[k] = new Bacon.Bus();
        });
        this.updateCategoriesAndSources();
        this.closeDialog = this.closeDialog.bind(this);
        this.requestSave = this.requestSave.bind(this);
        this.setCategory = this.setCategory.bind(this);
        this.selectCategory = this.selectCategory.bind(this);
    }

    componentDidMount() {
        state.get("expenseDialogStream").onValue(e => this.handleOpen(e));

        const validity = {};
        const values = {};
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

        Bacon.combineWith((e, v) => Object.assign(e, { allValid: v }), expense, allValid)
            .sampledBy(this.submitStream)
            .filter(e => e.allValid)
            .onValue(e => this.saveExpense(e));
    }

    updateCategoriesAndSources() {
        const cats = state.get("categories");
        this.categories = defaultCategory.concat(cats);
        this.sources = state.get("sources");
        this.categorySource = categories.getDataSource();
    }

    handleOpen(expense) {
        console.log("Open expense", expense);
        this.updateCategoriesAndSources();
        Object.keys(fields).forEach(k => this.inputStreams[k].push(initValue(k, expense)));
        this.setState({ open: true });
    }

    closeDialog() {
        console.log("Closing dialog");
        this.setState({ open: false });
    }

    requestSave(event) {
        this.submitStream.push(true);
        event.preventDefault();
        event.stopPropagation();
    }

    saveExpense(expense) {
        const createNew = !expense.id;
        const sum = Money.from(expense.sum);
        const benefit = splitter.splitByShares(sum, expense.benefit.map(id => ({ userId: id, share: 1 })));
        const cost = calculateCost(sum, expense.sourceId, benefit);
        const data = Object.assign({}, expense, {
            date: time.date(expense.date),
            categoryId: expense.subcategoryId ? expense.subcategoryId : expense.categoryId,
            benefit: benefit.map(b => ({ userId: b.userId, sum: b.sum.toString() })),
            cost: cost.map(b => ({ userId: b.userId, sum: b.sum.toString() }))
        });

        delete data.id;
        delete data.subcategoryId;
        delete data.allValid;
        console.log("Saving expense", data);
        (createNew ? apiConnect.storeExpense(data) : apiConnect.updateExpense(expense.id, data))
            .then(e => {
                console.log("Stored expense", e);
                state.get("expensesUpdatedStream").push(expense.date);
                this.closeDialog();
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
        this.inputStreams.description.push(name);
    }

    setCategory(id, subcategoryId) {
        this.inputStreams.categoryId.push(id);
        this.inputStreams.subcategoryId.push(subcategoryId);
    }

    render() {
        const actions = [
            <FlatButton
                label="Peruuta"
                primary={true}
                onTouchTap={this.closeDialog} />,
            <FlatButton
                label="Tallenna"
                primary={true}
                disabled={!this.state.valid}
                keyboardFocused={true}
                onTouchTap={this.requestSave} />
        ];

        return <Dialog
                    contentClassName="expense-dialog"
                    title={ this.state.createNew ? "Uusi kirjaus" : "Muokkaa kirjausta" }
                    actions={actions}
                    modal={false}
                    autoDetectWindowHeight={true}
                    autoScrollBodyContent={true}
                    open={this.state.open}
                    onRequestClose={this.closeDialog}>
            <form onSubmit={this.requestSave}>
                <div>
                    <UserAvatar userId={this.state.userId} style={{ verticalAlign: "middle" }} />
                    <div style={{ height: "72px", marginLeft: "2em", display: "inline-block", verticalAlign: "middle" }}>
                        <SumField value={this.state.sum} errorText={this.state.errors.sum} onChange={v => this.inputStreams.sum.push(v)} />
                    </div>
                </div>
                <DescriptionField
                    value={this.state.description}
                    onSelect={this.selectCategory}
                    dataSource={this.categorySource}
                    errorText={this.state.errors.description}
                    onChange={v => this.inputStreams.description.push(v)}
                />
                <ReceiverField value={this.state.receiver} onChange={v => this.inputStreams.receiver.push(v)}
                               errorText={this.state.errors.receiver} />
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
            </form>
        </Dialog>
    }
}
