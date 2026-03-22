import * as B from 'baconjs';
import { DateTime } from 'luxon';
import * as React from 'react';

import { UserExpenseWithDetails } from 'shared/expense';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { categoryDataSourceP, categoryMapP } from 'client/data/Categories';
import { sourceMapP, validSessionP } from 'client/data/Login';
import { updateExpenses } from 'client/data/State';
import { ExpenseDialogObject } from 'client/data/StateTypes';
import { logger } from 'client/Logger';
import { connect } from 'client/ui/component/BaconConnect';
import { Size } from 'client/ui/layout/Styles.ts';
import { unsubscribeAll, Unsubscriber } from 'client/util/ClientUtil';

import { ExpenseDialogProps } from './ExpenseDialog';
import { ExpenseSaveAction } from './ExpenseSaveAction';

interface ExpenseDialogListenerState<D> {
  open: boolean;
  original: UserExpenseWithDetails | null;
  resolve: (e: D | null) => void;
  expenseCounter: number;
  saveAction: ExpenseSaveAction | null;
  values: Partial<D>;
  title?: string;
}

let expenseCounter = 1;

export function createExpenseDialogListener<D>(
  Dialog: React.ComponentType<ExpenseDialogProps<D>>,
  bus: B.EventStream<ExpenseDialogObject<D>>,
) {
  const ConnectedDialog = connect(
    B.combineTemplate({
      sources: validSessionP.map(s => s.sources),
      categories: validSessionP.map(s => s.categories),
      user: validSessionP.map(s => s.user),
      group: validSessionP.map(s => s.group),
      sourceMap: sourceMapP,
      categorySource: categoryDataSourceP,
      categoryMap: categoryMapP,
      groupings: validSessionP.map(s => s.groupings),
      users: validSessionP.map(s => s.users),
    }),
  )(Dialog);

  return class ExpenseDialogListener extends React.Component<
    { windowSize: Size },
    ExpenseDialogListenerState<D>
  > {
    unsub: Unsubscriber[] = [];

    public state: ExpenseDialogListenerState<D> = {
      open: false,
      original: null,
      resolve: noop,
      expenseCounter: 0,
      values: {},
      saveAction: null,
      title: undefined,
    };

    componentDidMount() {
      this.unsub.push(bus.onValue(e => this.handleOpen(e)));
    }

    componentWillUnmount() {
      unsubscribeAll(this.unsub);
      this.unsub = [];
    }

    onExpensesUpdated = (date: DateTime) => {
      updateExpenses(date);
    };

    handleOpen = async (data: ExpenseDialogObject<D>) => {
      expenseCounter += 1;
      if (data.expenseId) {
        logger.info('Edit expense %s', data.expenseId);
        this.setState({ open: false, original: null });
        const original = await apiConnect.getExpense(data.expenseId);
        this.setState({
          open: true,
          original,
          resolve: data.resolve,
          expenseCounter,
          values: data.values || {},
          saveAction: data.saveAction ?? null,
          title: data.title,
        });
      } else {
        logger.info('Create new expense');
        this.setState({
          open: true,
          original: null,
          resolve: data.resolve,
          expenseCounter,
          values: data.values || {},
          saveAction: data.saveAction ?? null,
          title: data.title,
        });
      }
    };

    closeDialog = (e: D | null) => {
      logger.info('Closing dialog');
      this.state.resolve(e);
      this.setState({ open: false, original: null });
    };

    render() {
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
          title={this.state.title}
        />
      ) : null;
    }
  };
}
