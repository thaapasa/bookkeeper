import * as React from 'react';
import ExpenseTable from './expense-table'
import * as Bacon from 'baconjs'
import ExpenseNavigation from './expense-navigation'
import * as state from '../../data/state';
import * as apiConnect from '../../data/api-connect';
import {unsubscribeAll} from '../../util/client-util';
import * as moment from 'moment';

interface MonthViewState {
    date: moment.Moment;
    loading: boolean;
    expenses: any[];
    startStatus: any;
    endStatus: any;
    monthStatus: any;
    unconfirmedBefore: boolean;
}

export default class MonthView extends React.Component<any, MonthViewState> {

    private unsub: any[];
    private loadExpenses: any;

    public state: MonthViewState = {
        date: moment(),
        loading: false,
        expenses: [],
        startStatus: {},
        endStatus: {},
        monthStatus: {},
        unconfirmedBefore: false,
    };

    public componentDidMount() {
        this.unsub = [];
        this.loadExpenses = new Bacon.Bus();
        this.unsub.push(this.loadExpenses);
        const expensesFromServer = this.loadExpenses.flatMapLatest(date => Bacon.fromPromise(apiConnect.getExpensesForMonth(date.year(), date.month() + 1)));
        this.unsub.push(state.get("expensesUpdatedStream").onValue(date => {
            const d = moment(date);
            this.setState({ date: d, loading: true, expenses: [], startStatus: {}, endStatus: {}, monthStatus: {} });
            this.loadExpenses.push(d);
        }));
        this.unsub.push(expensesFromServer.onValue(e => {
            this.setState(Object.assign({ loading: false }, e));
        }));
        state.updateExpenses(moment());
    }

    public componentWillUnmount() {
        unsubscribeAll(this.unsub);
    }

    private onUpdateExpense = (id, data) => {
        this.setState(s => ({ expenses: s.expenses.map(e => e.id === id ? data : e) }));
    }

    public render() {
        return <div className="content">
            <ExpenseNavigation date={this.state.date} />
            <ExpenseTable
                date={this.state.date}
                expenses={this.state.expenses}
                loading={this.state.loading}
                startStatus={this.state.startStatus}
                endStatus={this.state.endStatus}
                monthStatus={this.state.monthStatus}
                unconfirmedBefore={this.state.unconfirmedBefore}
                onUpdateExpense={this.onUpdateExpense} />
        </div>
    }
}
