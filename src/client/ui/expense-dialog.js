"use strict";
import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import DatePicker from 'material-ui/DatePicker';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import UserSelector from "./user-selector";
const moment = require("moment");
import * as splitter from "../../shared/util/splitter";
import Money from "../../shared/util/money";

import * as apiConnect from "../data/api-connect";
import * as state from "../data/state"
import * as time from "../../shared/util/time"

const fields = {
    "description": { default: "" },
    "sourceId": { default: () => state.get("group").defaultSourceId },
    "categoryId": { default: 0 },
    "subcategoryId": { default: 0 },
    "receiver": { default: "" },
    "sum": { default: "" },
    "date": { default: () => moment().toDate() },
    "benefit": { default: () => [state.get("user").id] }
};

const styles = {
    category: { width: "50%" },
    source: { width: "100%" }
};

const defaultCategory = [ { id: 0, name: "Kategoria" }];
const defaultSubcategory = [ { id: 0, name: "Alikategoria" }];

function getDefault(v) {
    return typeof v === "function" ? v() : v;
}

export default class ExpenseDialog extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            open: false,
            createNew: true,
            subcategories: defaultSubcategory
        };
        this.categories = defaultCategory.concat(state.get("categories"));
        this.sources = state.get("sources");
        Object.keys(fields).forEach(k => this.state[k] = getDefault(fields[k].default));
        this.handleClose = this.handleClose.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.setCategory = this.setCategory.bind(this);
    }

    handleOpen(expense) {
        console.log("handleOpen");
        const newState = { open: true, createNew: expense === undefined };
        Object.keys(fields).forEach(k => newState[k] = expense ? expense[k] : getDefault(fields[k].default));
        if (expense) {
            newState.date = time.fromDate(expense.date).toDate();
        }
        console.log(newState);
        this.setState(newState);
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
        const benefit = splitter.splitByShares(new Money(this.state.sum), this.state.benefit.map(id => ({ userId: id, share: 1 })));
        const expense = {
            date: time.date(this.state.date),
            sum: this.state.sum,
            description: this.state.description,
            sourceId: this.state.sourceId,
            categoryId: this.state.subcategoryId ? this.state.subcategoryId : this.state.categoryId,
            receiver: this.state.receiver,
            benefit: benefit.map(b => ({ userId: b.userId, sum: b.sum.toString() })),
            userId: state.get("user").id
        };
        console.log("Saving expense", expense);
        apiConnect.storeExpense(expense)
            .then(e => {
                console.log("Stored expense", e);
                state.get("expensesUpdatedStream").push(expense);
                this.setState({open: false});
            });
    };
    componentDidMount() {
        state.get("expenseDialogStream").onValue(e => {console.log("dialog onValue"); this.handleOpen(e)});
    }

    setCategory(id, subcategoryId) {
        this.setState({
            categoryId: id,
            subcategoryId: subcategoryId ? subcategoryId : 0,
            subcategories: defaultSubcategory.concat(this.categories.find(c => c.id == id).children)
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
                    title={ typeof this.state.createNew ? "Uusi kirjaus" : "Muokkaa kirjausta"}
                    actions={actions}
                    modal={false}
                    open={this.state.open}
                    onRequestClose={this.handleClose}>
            <form onSubmit={this.handleSubmit}>
                <TextField
                    hintText="0.00"
                    floatingLabelText="Summa"
                    floatingLabelFixed={true}
                    fullWidth={true}
                    value={this.state.sum}
                    onChange={i => this.setState({sum: i.target.value})}
                />
                <TextField
                    hintText="Makkaroita"
                    floatingLabelFixed={true}
                    floatingLabelText="Kuvaus"
                    value={this.state.description}
                    fullWidth={true}
                    onChange={i => this.setState({description: i.target.value})}
                />
                <DropDownMenu
                    value={this.state.categoryId}
                    id="category"
                    style={ styles.category }
                    autoWidth={false}
                    onChange={(i, j, v) => this.setCategory(v)}
                >
                    { this.categories.map((row, index) => (
                        <MenuItem key={index} value={row.id} primaryText={row.name} />
                    ))}
                </DropDownMenu>
                <DropDownMenu
                    value={this.state.subcategoryId}
                    style={ styles.category }
                    autoWidth={false}
                    onChange={(i, j, v) => this.setState({ subcategoryId: v })}
                >
                    { this.state.subcategories.map((row, index) => (
                        <MenuItem key={row.id} value={row.id} primaryText={row.name} />
                    ))}
                </DropDownMenu>
                <br />

                <div style={{ display: "flex", flexWrap: "nowrap" }}>
                    <DropDownMenu
                        value={this.state.sourceId}
                        style={{ flexGrow: "1" }}
                        autoWidth={false}
                        onChange={(i, j, v) => this.setState({ sourceId: v })}
                    >
                        { this.sources.map((row, index) => <MenuItem key={row.id} value={row.id} primaryText={row.name}/>) }
                    </DropDownMenu>
                    <UserSelector style={{ paddingTop: "0.5em" }} selected={this.state.benefit} onChange={x => this.setState({ benefit: x })} />
                </div>
                <br />

                <DatePicker
                    value={this.state.date}
                    formatDate={d => moment(d).format("D.M.YYYY")}
                    floatingLabelText="Päivämäärä"
                    floatingLabelFixed={true}
                    fullWidth={true}
                    autoOk={true}
                    onChange={(event, date) => this.setState({ date: date })} />

                <TextField
                    hintText="Kauppa"
                    floatingLabelText="Saaja"
                    floatingLabelFixed={true}
                    fullWidth={true}
                    value={this.state.receiver}
                    onChange={i => this.setState({receiver: i.target.value})}
                />
            </form>
        </Dialog>
    }
}
