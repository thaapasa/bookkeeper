import * as B from 'baconjs';
import debug from 'debug';
import { Moment } from 'moment';
import * as React from 'react';

import { UserExpenseWithDetails } from 'shared/expense';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { categoryDataSourceP, categoryMapE } from 'client/data/Categories';
import { sourceMapE, validSessionE } from 'client/data/Login';
import { updateExpenses } from 'client/data/State';
import { ExpenseDialogObject } from 'client/data/StateTypes';
import { connect } from 'client/ui/component/BaconConnect';
import { Size } from 'client/ui/Types';
import { unsubscribeAll, Unsubscriber } from 'client/util/ClientUtil';

import { ExpenseDialogProps } from './ExpenseDialog';
import { ExpenseSaveAction } from './ExpenseSaveAction';

const log = debug('bookkeeper:expense-dialog');

interface ExpenseDialogListenerState<D> {
  open: boolean;
  original: UserExpenseWithDetails | null;
  resolve: (e: D | null) => void;
  expenseCounter: number;
  saveAction: ExpenseSaveAction | null;
  values: Partial<D>;
}

let expenseCounter = 1;

export function createExpenseDialogListener<D>(
  Dialog: React.ComponentType<ExpenseDialogProps<D>>,
  bus: B.EventStream<ExpenseDialogObject<D>>,
) {
  const ConnectedDialog = connect(
    B.combineTemplate({
      sources: validSessionE.map(s => s.sources),
      categories: validSessionE.map(s => s.categories),
      user: validSessionE.map(s => s.user),
      group: validSessionE.map(s => s.group),
      sourceMap: sourceMapE,
      categorySource: categoryDataSourceP,
      categoryMap: categoryMapE,
      users: validSessionE.map(s => s.users),
    }),
  )(Dialog);

  return class ExpenseDialogListener extends React.Component<{ windowSize: Size }, ExpenseDialogListenerState<D>> {
    private unsub: Unsubscriber[] = [];

    public state: ExpenseDialogListenerState<D> = {
      open: false,
      original: null,
      resolve: noop,
      expenseCounter: 0,
      values: {},
      saveAction: null,
    };

    public componentDidMount() {
      this.unsub.push(bus.onValue(e => this.handleOpen(e)));
    }

    public componentWillUnmount() {
      unsubscribeAll(this.unsub);
      this.unsub = [];
    }

    private onExpensesUpdated = (date: Moment) => {
      updateExpenses(date);
    };

    private handleOpen = async (data: ExpenseDialogObject<D>) => {
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
          saveAction: data.saveAction ?? null,
        });
      } else {
        log('Create new expense');
        this.setState({
          open: true,
          original: null,
          resolve: data.resolve,
          expenseCounter,
          values: data.values || {},
          saveAction: data.saveAction ?? null,
        });
      }
    };

    private closeDialog = (e: D | null) => {
      log('Closing dialog');
      this.state.resolve(e);
      this.setState({ open: false, original: null });
      return false;
    };

    public render() {
      return this.state.open ? (
        <ConnectedDialog
          {...this.state}
          windowSize={this.props.windowSize}
          expenseCounter={this.state.expenseCounter}
          onExpensesUpdated={this.onExpensesUpdated}
          createNew={!this.state.original}
          saveAction={this.state.saveAction}
          onClose={this.closeDialog}
          values={this.state.values}
        />
      ) : null;
    }
  };
}
