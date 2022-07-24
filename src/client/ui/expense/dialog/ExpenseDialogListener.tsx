import * as B from 'baconjs';
import debug from 'debug';
import * as React from 'react';

import { ExpenseInEditor, UserExpenseWithDetails } from 'shared/types/Expense';
import { noop } from 'shared/util/Util';
import apiConnect from 'client/data/ApiConnect';
import { categoryDataSourceP, categoryMapE } from 'client/data/Categories';
import { sourceMapE, validSessionE } from 'client/data/Login';
import { updateExpenses } from 'client/data/State';
import { ExpenseDialogObject } from 'client/data/StateTypes';
import { connect } from 'client/ui/component/BaconConnect';
import { Size } from 'client/ui/Types';
import { unsubscribeAll, Unsubscriber } from 'client/util/ClientUtil';

import { ExpenseDialogProps } from './ExpenseDialog';

const log = debug('bookkeeper:expense-dialog');

interface ExpenseDialogListenerState {
  open: boolean;
  original: UserExpenseWithDetails | null;
  resolve: (e: ExpenseInEditor | null) => void;
  expenseCounter: number;
  values: Partial<ExpenseInEditor>;
}

let expenseCounter = 1;

export function createExpenseDialogListener(
  Dialog: React.ComponentType<ExpenseDialogProps>,
  bus: B.EventStream<ExpenseDialogObject>
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
    })
  )(Dialog);

  return class ExpenseDialogListener extends React.Component<
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
      this.unsub.push(bus.onValue(e => this.handleOpen(e)));
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
        <ConnectedDialog
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
  };
}
