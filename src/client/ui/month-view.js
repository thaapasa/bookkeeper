import React from "react"
import ExpenseTable from "./expense-table"
import * as Bacon from "baconjs"
import ExpenseNavigation from "./expense-navigation"
const moment = require("moment");
import * as state from "../data/state";
import * as apiConnect from "../data/api-connect";

export default class MonthView extends React.Component {

    constructor(props) {
        super(props);
        this.state = { date: moment(), loading: false, expenses: [], startStatus: {}, endStatus: {}, monthStatus: {} };
        this.loadExpenses = new Bacon.Bus();
        this.onUpdateExpense = this.onUpdateExpense.bind(this);
    }

    componentDidMount() {
        const expensesFromServer = this.loadExpenses.flatMapLatest(date => Bacon.fromPromise(apiConnect.getExpensesForMonth(date.year(), date.month() + 1)));
        state.get("expensesUpdatedStream").onValue(date => {
            const d = moment(date);
            this.setState({ date: d, loading: true, expenses: [], startStatus: {}, endStatus: {}, monthStatus: {} });
            this.loadExpenses.push(d);
        });
        this.unsubscribeStream = expensesFromServer.onValue(e => {
            this.setState(Object.assign({ loading: false }, e))
        });
        state.updateExpenses(moment());
    }

    componentWillUnmount() {
        this.unsubscribeStream();
    }

    onUpdateExpense(id, data) {
        this.setState(s => ({ expenses: s.expenses.map(e => e.id === id ? data : e) }));
    }

    render() {
        return <div className="content">
            <ExpenseNavigation date={this.state.date} />
            <ExpenseTable
                date={this.state.date}
                expenses={this.state.expenses}
                loading={this.state.loading}
                startStatus={this.state.startStatus}
                endStatus={this.state.endStatus}
                monthStatus={this.state.monthStatus}
                onUpdateExpense={this.onUpdateExpense} />
        </div>
    }
}
