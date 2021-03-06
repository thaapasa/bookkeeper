import * as React from 'react';
import ExpenseTable from './ExpenseTable';
import apiConnect from 'client/data/ApiConnect';
import { unsubscribeAll, Unsubscriber } from 'client/util/ClientUtil';
import { UserExpense, ExpenseStatus } from 'shared/types/Expense';
import { zeroStatus } from './ExpenseHelper';
import { History } from 'history';
import { needUpdateE, navigationBus } from 'client/data/State';
import { toMoment, isSameMonth, monthRange } from 'shared/util/Time';
import { expensesForMonthPath, expensePagePath } from 'client/util/Links';
import debug from 'debug';
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
    navigationBus.push({
      dateRange: monthRange(date),
      pathPrefix: expensePagePath,
    });
    this.setState({
      loading: true,
      expenses: [],
      startStatus: zeroStatus,
      endStatus: zeroStatus,
      monthStatus: zeroStatus,
    });
    const m = toMoment(date);
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
      />
    );
  }
}
