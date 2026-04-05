import * as B from 'baconjs';
import { DateTime } from 'luxon';
import * as React from 'react';

import { UserExpenseWithDetails } from 'shared/expense';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { updateExpenses } from 'client/data/State';
import { ExpenseDialogObject } from 'client/data/StateTypes';
import { logger } from 'client/Logger';

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
  const ExpenseDialogListener: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const [state, setState] = React.useState<ExpenseDialogListenerState<D>>({
      open: false,
      original: null,
      resolve: noop,
      expenseCounter: 0,
      values: {},
      saveAction: null,
      title: undefined,
    });

    React.useEffect(() => {
      const unsub = bus.onValue(async (data: ExpenseDialogObject<D>) => {
        expenseCounter += 1;
        if (data.expenseId) {
          logger.info('Edit expense %s', data.expenseId);
          setState(s => ({ ...s, open: false, original: null }));
          const original = await apiConnect.getExpense(data.expenseId);
          setState({
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
          setState({
            open: true,
            original: null,
            resolve: data.resolve,
            expenseCounter,
            values: data.values || {},
            saveAction: data.saveAction ?? null,
            title: data.title,
          });
        }
      });
      return unsub;
    }, []);

    const resolveRef = React.useRef(state.resolve);
    React.useEffect(() => {
      resolveRef.current = state.resolve;
    }, [state.resolve]);

    const closeDialog = React.useCallback((e: D | null) => {
      logger.info('Closing dialog');
      resolveRef.current(e);
      setState(s => ({ ...s, open: false, original: null }));
    }, []);

    const onExpensesUpdated = React.useCallback((date: DateTime) => {
      updateExpenses(date);
    }, []);

    if (!state.open) {
      return null;
    }

    return (
      <Dialog
        {...state}
        isMobile={isMobile}
        expenseCounter={state.expenseCounter}
        onExpensesUpdated={onExpensesUpdated}
        createNew={!state.original}
        saveAction={state.saveAction}
        onClose={closeDialog}
        values={state.values}
        title={state.title}
      />
    );
  };

  return ExpenseDialogListener;
}
