import * as React from 'react';
import { type StoreApi, type UseBoundStore } from 'zustand';

import { UserExpenseWithDetails } from 'shared/expense';
import { ISODate } from 'shared/time';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { invalidateExpenseData } from 'client/data/query';
import { navigateToExpenseDate } from 'client/data/State';
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

interface RequestStore<D> {
  request: ExpenseDialogObject<D> | null;
  setRequest: (request: ExpenseDialogObject<D> | null) => void;
}

export function createExpenseDialogListener<D>(
  Dialog: React.ComponentType<ExpenseDialogProps<D>>,
  useStore: UseBoundStore<StoreApi<RequestStore<D>>>,
) {
  const ExpenseDialogListener: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const request = useStore(s => s.request);
    const [state, setState] = React.useState<ExpenseDialogListenerState<D>>({
      open: false,
      original: null,
      resolve: noop,
      expenseCounter: 0,
      values: {},
      saveAction: null,
      title: undefined,
    });

    // React to new requests from the store
    React.useEffect(() => {
      if (!request) return;
      const data = request;
      // Clear the store request immediately so future pushes are detected as new
      useStore.getState().setRequest(null);

      expenseCounter += 1;
      if (data.expenseId) {
        logger.info('Edit expense %s', data.expenseId);
        setState(s => ({ ...s, open: false, original: null }));
        apiConnect.getExpense(data.expenseId).then(original => {
          setState({
            open: true,
            original,
            resolve: data.resolve,
            expenseCounter,
            values: data.values || {},
            saveAction: data.saveAction ?? null,
            title: data.title,
          });
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
    }, [request]);

    const resolveRef = React.useRef(state.resolve);
    React.useEffect(() => {
      resolveRef.current = state.resolve;
    }, [state.resolve]);

    const closeDialog = React.useCallback((e: D | null) => {
      logger.info('Closing dialog');
      resolveRef.current(e);
      setState(s => ({ ...s, open: false, original: null }));
    }, []);

    const onExpensesUpdated = React.useCallback((date: ISODate) => {
      invalidateExpenseData();
      navigateToExpenseDate(date);
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
