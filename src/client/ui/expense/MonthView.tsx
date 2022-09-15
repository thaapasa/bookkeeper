import debug from 'debug';
import { History } from 'history';
import * as React from 'react';

import { ExpenseStatus, UserExpense } from 'shared/expense/Expense';
import { isSameMonth, toMoment } from 'shared/util/Time';
import { monthRange } from 'shared/util/TimeRange';
import apiConnect from 'client/data/ApiConnect';
import { navigationBus, needUpdateE } from 'client/data/State';
import { unsubscribeAll, Unsubscriber } from 'client/util/ClientUtil';
import { expensePagePath, expensesForMonthPath } from 'client/util/Links';

import { zeroStatus } from './ExpenseHelper';
import ExpenseTable from './ExpenseTable';
const log = debug('bookkeeper:month-view');

interface MonthViewProps {
  date: Date;
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

export default class MonthView extends React.PureComponent<
  MonthViewProps,
  MonthViewState
> {
  private unsub: Unsubscriber[] = [];

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
    this.unsub.push(needUpdateE.onValue(this.refreshExpensesFor));
  }

  public async componentDidUpdate(prevProps: MonthViewProps) {
    if (!toMoment(prevProps.date).isSame(this.props.date, 'month')) {
      this.loadExpenses(this.props.date);
    }
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  private async loadExpenses(date: Date) {
    const m = toMoment(date);
    navigationBus.push({
      dateRange: monthRange(m),
      pathPrefix: expensePagePath,
    });
    this.setState({
      loading: true,
      startStatus: zeroStatus,
      endStatus: zeroStatus,
      monthStatus: zeroStatus,
    });
    const expenses = await apiConnect.getExpensesForMonth(
      m.get('year'),
      m.get('month') + 1
    );
    log('Expenses for', date, expenses);
    this.setState({ loading: false, ...expenses });
  }

  private refreshExpensesFor = (date: Date) => {
    log('Expenses updated, refreshing for date', date);
    if (isSameMonth(date, this.props.date)) {
      log('Reloading expenses for this month');
      this.loadExpenses(date);
    } else {
      const path = expensesForMonthPath(date);
      log('Navigating to', path);
      this.props.history.push(path);
    }
  };

  private onUpdateExpense = (id: number, data: UserExpense) => {
    this.setState(s => ({
      expenses: s.expenses.map(e => (e.id === id ? data : e)),
    }));
  };

  public render() {
    return (
      <ExpenseTable
        expenses={this.state.expenses}
        loading={this.state.loading}
        startStatus={this.state.startStatus}
        endStatus={this.state.endStatus}
        monthStatus={this.state.monthStatus}
        unconfirmedBefore={this.state.unconfirmedBefore}
        onUpdateExpense={this.onUpdateExpense}
        dateBorder={true}
      />
    );
  }
}
