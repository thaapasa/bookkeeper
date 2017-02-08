import React from "react";
import ExpenseDivision from "./expense-division"
import Avatar from "material-ui/Avatar";
import Chip from "material-ui/Chip"
import ExpenseRow from "./expense-row";
import {ExpenseHeader,ExpenseStatus} from "./expense-row";
import * as apiConnect from "../data/api-connect";
import * as state from  "../data/state";
import * as time from "../../shared/util/time";
const Money = require("../../shared/util/money");
const moment = require("moment");

function expenseName(e) {
    return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}

export default class ExpenseTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = { date : moment(), expenses : [], details: {}, filters: [], startStatus: {}, endStatus: {}, monthStatus: {} };
        this.toggleDetails = this.toggleDetails.bind(this);
        this.deleteExpense = this.deleteExpense.bind(this);
        this.modifyExpense = this.modifyExpense.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.getExpensesForView = this.getExpensesForView.bind(this);
        this.updateExpenseWith = this.updateExpenseWith.bind(this);
        this.renderExpense = this.renderExpense.bind(this);
    }

    getExpensesForView(date) {
        const next = moment(date);
        console.log("getExpensesForView", next);
        this.setState({ date: next, details: {} });
        return apiConnect.getExpensesForMonth(next.year(), next.month() + 1)
            .then(e => {
                this.setState(e);
                return null;
            })
            .catch(err => { console.log("Caught error when getting expenses", err) });
    }

    showExpenseDetails(id, details) {
        this.setState(s => ({ details: Object.assign(s.details, { [id] : details })}));
        return null;
    }

    updateExpenseWith(id, data) {
        console.log("Expense", id, "updated to", data);
        this.setState(s => ({ expenses: s.expenses.map(e => e.id === id ? data : e) }));
    }

    toggleDetails(expense, details) {
        if (details) {
            this.setState(s => {
                const det = s.details;
                delete det[expense.id];
                return { details: det };
            });
        } else {
            this.showExpenseDetails(expense.id, {});
            apiConnect.getExpense(expense.id)
                .then(e => this.showExpenseDetails(expense.id, e))
                .catch(e => console.log("Error", e));
        }
    }

    componentDidMount() {
        state.get("expensesUpdatedStream").onValue(d => { this.getExpensesForView(d) });
        this.getExpensesForView(moment());
    }

    static getYearMonthString(date) {
        return time.getFinnishMonthName(date.month() + 1) + " " + date.year();
    }

    deleteExpense(e) {
        console.log("deleteExpense");
        const name = expenseName(e);
        state.confirm("Poista kirjaus",
            `Haluatko varmasti poistaa kirjauksen ${name}?`,
            "Poista")
            .then(b => b ? apiConnect.deleteExpense(e.id)
                    .then(x => state.notify(`Poistettu kirjaus ${name}`))
                    .then(x => this.getExpensesForView(e.date))
                : false)
            .catch(e => state.notifyError(`Virhe poistettaessa kirjausta ${name}`, e));
    }

    modifyExpense(expense) {
        apiConnect.getExpense(expense.id).then(e => state.editExpense(e))
    }

    addFilter(fun, name, avatar) {
        this.setState(s => ({
            filters: s.filters.concat({ filter: fun, name: name, avatar: avatar })
        }));
    }

    removeFilter(index) {
        this.setState(s => {
            s.filters.splice(index, 1);
            return s;
        });
    }

    getFilteredExpenses() {
        return this.state.expenses ? this.state.filters.reduce((a, b) => a.filter(b.filter), this.state.expenses) : [];
    }

    renderExpense(expense) {
        const details = this.state.details[expense.id];
        return [
            <ExpenseRow expense={ expense }
                        details={ details }
                        addFilter={ this.addFilter }
                        onUpdated={ e => this.updateExpenseWith(expense.id, e) }
                        onToggleDetails={ this.toggleDetails }
                        onModify={ this.modifyExpense }
                        onDelete={ this.deleteExpense } />
        ].concat(details && details.division ?
            [<ExpenseDivision
                expense={ expense }
                onDelete={this.deleteExpense}
                onModify={this.modifyExpense}
                division={details.division}/>] : [])
    }

    render() {
        const res = <div className="expense-table">
            <ExpenseHeader startStatus={this.state.startStatus} />
            <ExpenseStatus name="Tilanne ennen" status={this.state.startStatus} />
            { this.state.filters.length > 0 ?
                <div className="expense-row">
                    <div className="expense-filters">{
                        this.state.filters.map((f, index) => <Chip
                            key={index}
                            style={{ margin: "0.3em", padding: 0 }}
                            onRequestDelete={() => this.removeFilter(index)}>
                            { f.avatar ? <Avatar src={f.avatar} /> : null }
                            { f.name }
                        </Chip>)
                    }</div>
                </div>
                : undefined
            }
            { this.getFilteredExpenses().map(this.renderExpense) }
            <ExpenseStatus name="Tämä kuukausi" status={this.state.monthStatus} />
            <ExpenseStatus name="Lopputilanne" status={this.state.endStatus} />
        </div>;
        return res;
    }
}
