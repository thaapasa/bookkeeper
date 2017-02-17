import React from "react";
import ExpenseDivision from "./expense-division"
import Avatar from "material-ui/Avatar";
import Chip from "material-ui/Chip"
import ExpenseRow from "./expense-row";
import {ExpenseHeader,ExpenseStatus,ExpenseTotal} from "./expense-row";
import * as apiConnect from "../data/api-connect";
import * as state from  "../data/state";
import RefreshIndicator from 'material-ui/RefreshIndicator';
import {expenseName} from "./expense-helper";
const Money = require("../../shared/util/money");

export default class ExpenseTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = { details: {}, filters: [] };
        this.toggleDetails = this.toggleDetails.bind(this);
        this.deleteExpense = this.deleteExpense.bind(this);
        this.modifyExpense = this.modifyExpense.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.renderExpense = this.renderExpense.bind(this);
    }

    showExpenseDetails(id, details) {
        this.setState(s => ({ details: Object.assign(s.details, { [id] : details })}));
        return null;
    }

    hideExpenseDetails(id) {
        this.setState(s => {
            const det = s.details;
            delete det[id];
            return { details: det };
        });
    }

    toggleDetails(expense, details) {
        if (details) {
            this.hideExpenseDetails(expense.id);
        } else {
            this.showExpenseDetails(expense.id, {});
            apiConnect.getExpense(expense.id)
                .then(e => this.showExpenseDetails(expense.id, e))
                .catch(e => {
                    state.notifyError("Ei voitu ladata tietoja kirjaukselle", e);
                    this.hideExpenseDetails(expense.id);
                });
        }
    }

    deleteExpense(e) {
        const name = expenseName(e);
        state.confirm("Poista kirjaus",
            `Haluatko varmasti poistaa kirjauksen ${name}?`,
            { okText : "Poista" })
            .then(b => b ? apiConnect.deleteExpense(e.id)
                    .then(x => state.notify(`Poistettu kirjaus ${name}`))
                    .then(x => state.updateExpenses(e.date))
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
        return this.props.expenses ? this.state.filters.reduce((a, b) => a.filter(b.filter), this.props.expenses) : [];
    }

    renderExpense(expense) {
        const details = this.state.details[expense.id];
        return [
            <ExpenseRow expense={ expense }
                        details={ details }
                        addFilter={ this.addFilter }
                        onUpdated={ e => this.props.onUpdateExpense(expense.id, e) }
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

    getTotalRow(expenses) {
        if (expenses.length < 1) return [];
        const income = expenses.filter(e => e.type === "income").reduce((s, c) => s.plus(c.sum), Money.zero);
        const expense = expenses.filter(e => e.type === "expense").reduce((s, c) => s.plus(c.sum), Money.zero);
        return [<ExpenseTotal key="filtered-total" gincome={income} expense={expense} />];
    }

    render() {
        const filtered = this.getFilteredExpenses();
        return <div className="expense-table">
            <ExpenseHeader className="expense-table-header"/>
            <ExpenseStatus className="expense-table-start-status" name="Tilanne ennen" status={this.props.startStatus} unconfirmedBefore={this.props.unconfirmedBefore} />
            <div className="expense-data-area">
                { this.props.loading ?
                    <div className="loading-indicator-big"><RefreshIndicator left={-30} top={-30} status="loading" size={60} /></div> :
                    (this.state.filters.length > 0 ?
                        [ <div className="expense-row" key="filters">
                            <div className="expense-filters">{
                                this.state.filters.map((f, index) => <Chip
                                    key={index}
                                    style={{margin: "0.3em", padding: 0}}
                                    onRequestDelete={() => this.removeFilter(index)}>
                                    { f.avatar ? <Avatar src={f.avatar}/> : null }
                                    { f.name }
                                </Chip>)
                            }</div>
                        </div> ]
                        : []).concat(filtered.map(this.renderExpense)).concat(this.getTotalRow(filtered))
                }
            </div>
            <ExpenseStatus className="expense-table-month-status" name="Tämä kuukausi" status={this.props.monthStatus} />
            <ExpenseStatus className="expense-table-end-status" name="Lopputilanne" status={this.props.endStatus} />
        </div>
    }
}
