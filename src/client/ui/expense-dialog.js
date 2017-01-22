"use strict";
import React from 'react';
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

const fields = {
    "description": { default: "" },
    "sourceId": { default: () => state.get("group").defaultSourceId },
    "categoryId": { default: 0, read: (e) => findParentCategory(e.categoryId) },
    "subcategoryId": { default: 0, read: (e) => e.categoryId },
    "receiver": { default: "" },
    "sum": { default: "" },
    "userId": { default: () => state.get("user").id, read: (e) => e.userId },
    "date": { default: () => moment().toDate(), read: (e) => time.fromDate(e.date).toDate() },
    "benefit": { default: () => [state.get("user").id], read: (e) => e.division.filter(d => d.type === "benefit").map(d => d.userId) }
};

const styles = {
    category: { width: "50%" },
    source: { width: "100%" }
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

export default class ExpenseDialog extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            id: null,
            open: false,
            createNew: true,
            subcategories: defaultSubcategory
        };
        this.updateCategoriesAndSources();
        Object.keys(fields).forEach(k => this.state[k] = initValue(k));
        this.handleClose = this.handleClose.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.setCategory = this.setCategory.bind(this);
        this.selectCategory = this.selectCategory.bind(this);
    }

    updateCategoriesAndSources() {
        const cats = state.get("categories");
        this.categories = defaultCategory.concat(cats);
        this.sources = state.get("sources");
        this.categorySource = categories.getDataSource();
    }

    handleOpen(expense) {
        console.log("handleOpen");
        this.updateCategoriesAndSources();
        const newState = { open: true, createNew: expense === undefined };
        Object.keys(fields).forEach(k => newState[k] = initValue(k, expense));
        if (expense) {
            newState.date = time.fromDate(expense.date).toDate();
        }
        newState.id = expense ? expense.id : null;
        console.log(expense, newState);
        this.setState(newState);
        this.setCategory(newState.categoryId, newState.subcategoryId);
    };

    handleClose() {
        console.log("closing dialog");
        this.setState({open: false});
    };

    handleSubmit(event) {
        event.preventDefault();
        this.handleSave();
    }

    handleSave() {
        const sum = Money.from(this.state.sum);
        const benefit = splitter.splitByShares(sum, this.state.benefit.map(id => ({ userId: id, share: 1 })));
        const cost = calculateCost(sum, this.state.sourceId, benefit);
        const expense = {
            date: time.date(this.state.date),
            sum: this.state.sum,
            description: this.state.description,
            sourceId: this.state.sourceId,
            categoryId: this.state.subcategoryId ? this.state.subcategoryId : this.state.categoryId,
            receiver: this.state.receiver,
            benefit: benefit.map(b => ({ userId: b.userId, sum: b.sum.toString() })),
            cost: cost.map(b => ({ userId: b.userId, sum: b.sum.toString() })),
            userId: state.get("user").id
        };

        console.log("Saving expense", expense);
        (this.state.createNew ? apiConnect.storeExpense(expense) : apiConnect.updateExpense(this.state.id, expense))
            .then(e => {
                console.log("Stored expense", e);
                state.get("expensesUpdatedStream").push(expense.date);
                this.setState({open: false});
            });
    };
    componentDidMount() {
        state.get("expenseDialogStream").onValue(e => {console.log("dialog onValue"); this.handleOpen(e)});
    }

    selectCategory(id) {
        const m = state.get("categoryMap");
        const name = m[id].name;
        if (m[id].parentId) {
            this.setCategory(m[id].parentId, id);
        } else {
            this.setCategory(id, 0);
        }
        this.setState({ description: name });
    }

    setCategory(id, subcategoryId) {
        this.setState({
            categoryId: id,
            subcategoryId: subcategoryId ? subcategoryId : 0,
            subcategories: defaultSubcategory.concat(this.categories.find(c => c.id == id).children || [])
        });
    }

    render() {
        const actions = [
            <FlatButton
                label="Peruuta"
                primary={true}
                onTouchTap={this.handleClose} />,
            <FlatButton
                label="Tallenna"
                primary={true}
                keyboardFocused={true}
                onTouchTap={this.handleSave} />
        ];

        return <Dialog
                    title={ this.state.createNew ? "Uusi kirjaus" : "Muokkaa kirjausta" }
                    actions={actions}
                    modal={false}
                    autoDetectWindowHeight={true}
                    autoScrollBodyContent={true}
                    open={this.state.open}
                    onRequestClose={this.handleClose}>
            <form onSubmit={this.handleSubmit}>
                <UserAvatar userId={this.state.userId} />
                <SumField value={this.state.sum} style={{ marginLeft: "2em" }} onChange={s => this.setState({sum: s})} />
                <DescriptionField
                    value={this.state.description}
                    onSelect={this.selectCategory}
                    dataSource={this.categorySource}
                    onChange={(v) => this.setState({description: v})}
                />
                <CategorySelector
                    category={this.state.categoryId} categories={this.categories} onChangeCategory={this.setCategory}
                    subcategory={this.state.subcategoryId} subcategories={this.state.subcategories}
                    onChangeSubcategory={i => this.setState({ subcategoryId: i })} />
                <br />

                <div style={{ display: "flex", flexWrap: "nowrap" }}>
                    <SourceSelector
                        value={this.state.sourceId} sources={this.sources} style={{ flexGrow: "1" }}
                        onChange={v => this.setState({ sourceId: v, benefit: state.get("sourceMap")[v].users.map(u => u.userId) })} />
                    <UserSelector style={{ paddingTop: "0.5em" }} selected={this.state.benefit} onChange={x => this.setState({ benefit: x })} />
                </div>
                <br />

                <DateField value={this.state.date} onChange={date => this.setState({ date: date })} />
                <ReceiverField value={this.state.receiver} onChange={v => this.setState({receiver: v})} />
            </form>
        </Dialog>
    }
}
