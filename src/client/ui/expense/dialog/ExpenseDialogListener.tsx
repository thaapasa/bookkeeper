import * as React from 'react';
import * as B from 'baconjs';
import debug from 'debug';
import apiConnect from 'client/data/ApiConnect';
import { unsubscribeAll, Unsubscriber } from 'client/util/ClientUtil';
import { UserExpenseWithDetails, ExpenseInEditor } from 'shared/types/Expense';
import { noop } from 'shared/util/Util';
import { connect } from '../../component/BaconConnect';
import { validSessionE, sourceMapE } from 'client/data/Login';
import { categoryDataSourceP, categoryMapE } from 'client/data/Categories';
import { expenseDialogE, updateExpenses } from 'client/data/State';
import { ExpenseDialogObject } from 'client/data/StateTypes';
import { ExpenseDialog } from './ExpenseDialog';
import { Size } from '../../Types';

const log = debug('bookkeeper:expense-dialog');

const ConnectedExpenseDialog = connect(
  B.combineTemplate({
    sources: validSessionE.map(s => s.sources),
    categories: validSessionE.map(s => s.categories),
    user: validSessionE.map(s => s.user),
    group: validSessionE.map(s => s.group),
    sourceMap: sourceMapE,
    categorySource: categoryDataSourceP,
    categoryMap: categoryMapE,
    users: validSessionE.map(s => s.users),
  })
)(ExpenseDialog);

interface ExpenseDialogListenerState {
  open: boolean;
  original: UserExpenseWithDetails | null;
  resolve: (e: ExpenseInEditor | null) => void;
  expenseCounter: number;
  values: Partial<ExpenseInEditor>;
}

let expenseCounter = 1;

export default class ExpenseDialogListener extends React.Component<
  { windowSize: Size },
  ExpenseDialogListenerState
> {
  private unsub: Unsubscriber[] = [];

  public state: ExpenseDialogListenerState = {
    open: false,
    original: null,
    resolve: noop,
    expenseCounter: 0,
    values: {},
  };

  public componentDidMount() {
    this.unsub.push(expenseDialogE.onValue(e => this.handleOpen(e)));
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
    this.unsub = [];
  }

  private onExpensesUpdated = (date: Date) => {
    updateExpenses(date);
  };

  private handleOpen = async (data: ExpenseDialogObject) => {
    expenseCounter += 1;
    if (data.expenseId) {
      log('Edit expense', data.expenseId);
      this.setState({ open: false, original: null });
      const original = await apiConnect.getExpense(data.expenseId);
      this.setState({
        open: true,
        original,
        resolve: data.resolve,
        expenseCounter,
        values: data.values || {},
      });
    } else {
      log('Create new expense');
      this.setState({
        open: true,
        original: null,
        resolve: data.resolve,
        expenseCounter,
        values: data.values || {},
      });
    }
  };

  private closeDialog = (e: ExpenseInEditor | null) => {
    log('Closing dialog');
    this.state.resolve(e);
    this.setState({ open: false, original: null });
    return false;
  };

  public render() {
    return this.state.open ? (
      <ConnectedExpenseDialog
        {...this.state}
        windowSize={this.props.windowSize}
        expenseCounter={this.state.expenseCounter}
        onExpensesUpdated={this.onExpensesUpdated}
        createNew={!this.state.original}
        onClose={this.closeDialog}
        values={this.state.values}
      />
    ) : null;
  }
}
