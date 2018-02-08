import * as React from 'react';
import ExpenseTable from './ExpenseTable'
import * as Bacon from 'baconjs'
import ExpenseNavigation from './ExpenseNavigation'
import * as state from '../../data/State';
import * as apiConnect from '../../data/ApiConnect';
import { unsubscribeAll } from '../../util/ClientUtil';
import * as moment from 'moment';
import { UserExpense, ExpenseStatus, Expense } from '../../../shared/types/Expense';
import { zeroStatus } from './ExpenseHelper';
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

export default class MonthView extends React.Component<MonthViewProps, MonthViewState> {

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
