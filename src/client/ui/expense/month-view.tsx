import * as React from 'react';
import ExpenseTable from './expense-table'
import * as Bacon from 'baconjs'
import ExpenseNavigation from './expense-navigation'
import * as state from '../../data/state';
import * as apiConnect from '../../data/api-connect';
import { unsubscribeAll } from '../../util/client-util';
import * as moment from 'moment';
import { UserExpense, ExpenseStatus, Expense } from '../../../shared/types/Expense';
import { zeroStatus } from './expense-helper';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { expenseMonthPattern, expenseMonthPathPattern } from '../../util/links';
import { RouteComponentProps } from 'react-router';
import { History } from 'history';
const debug = require('debug')('bookkeeper:month-view');

interface MonthViewProps {
    date: moment.Moment;
    history: History;
}

interface MonthViewState {
    loading: boolean;
    expenses: UserExpense[];
    startStatus: ExpenseStatus;
    endStatus: ExpenseStatus;
    monthStatus: ExpenseStatus;
    unconfirmedBefore: boolean;
}

class MonthView extends React.Component<MonthViewProps, MonthViewState> {

    public state: MonthViewState = {
        loading: false,
        expenses: [],
        startStatus: zeroStatus,
        endStatus: zeroStatus,
        monthStatus: zeroStatus,
        unconfirmedBefore: false,
    };

    public async componentDidMount() {
        this.loadExpenses(this.props.date);
    }

    public async componentWillUpdate(newProps: MonthViewProps) {
        if (newProps.date !== this.props.date) {
            this.loadExpenses(newProps.date);
        }
    }

    private async loadExpenses(date: moment.Moment) {
        this.setState({ loading: true, expenses: [], startStatus: zeroStatus, endStatus: zeroStatus, monthStatus: zeroStatus });
        const expenses = await apiConnect.getExpensesForMonth(date.get('year'), date.get('month') + 1);
        debug('Expenses for', date.toDate(), expenses);
        this.setState({ loading: false, ...expenses });
    }

    private onUpdateExpense = (id: number, data: UserExpense) => {
        this.setState(s => ({ expenses: s.expenses.map(e => e.id === id ? data : e) }));
    }

    public render() {
        return <div className="content">
            <ExpenseNavigation date={this.props.date} history={this.props.history} />
            <ExpenseTable
                date={this.props.date}
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

interface MonthRouteParams {
    date?: string;
};

class RoutedMonthView extends React.Component<RouteComponentProps<MonthRouteParams>, {}> {
    private getDate(): moment.Moment {
        if (!this.props.match.params.date) { return moment(); }
        return moment(this.props.match.params.date, expenseMonthPattern);
    }

    public render() {
        const date = this.getDate();
        this.props.history;
        return <MonthView date={date} history={this.props.history} />;
    }
}

export default class MonthViewWrapper extends React.Component<{}, {}> {
    public render() {
        return (
            <Router>
                <Switch>
                    <Route path={expenseMonthPathPattern('date')} component={RoutedMonthView} />
                    <Route path="" component={RoutedMonthView} />
                </Switch>
            </Router>
        );
    }
}
