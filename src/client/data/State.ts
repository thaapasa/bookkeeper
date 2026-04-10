import { ExpenseInEditor, ExpenseSplit } from 'shared/expense';
import { noop } from 'shared/util';
import { ExpenseSaveAction } from 'client/ui/expense/dialog/ExpenseSaveAction';

import { useExpenseDialogRequestStore, useExpenseSplitRequestStore } from './ExpenseDialogStore';
import type { ExpenseDialogObject } from './StateTypes';

// Re-export for backward compatibility — callers don't need to update imports yet
export { navigateToExpenseDate } from './NavigationStore';
export { notify, notifyError } from './NotificationStore';

export function editExpense(
  expenseId: number,
  options?: Partial<ExpenseDialogObject<ExpenseInEditor>>,
): Promise<ExpenseInEditor | null> {
  return new Promise<ExpenseInEditor | null>(resolve => {
    useExpenseDialogRequestStore.getState().setRequest({ ...options, expenseId, resolve });
  });
}

export function splitExpense(expenseId: number): Promise<ExpenseSplit[] | null> {
  return new Promise<ExpenseSplit[] | null>(resolve => {
    useExpenseSplitRequestStore.getState().setRequest({ expenseId, resolve });
  });
}

/**
 * Fire up the expense editor, and save the resulting expense to DB
 */
export async function createExpense(reference?: Partial<ExpenseInEditor>): Promise<void> {
  await requestNewExpense(undefined, undefined, reference);
}

export function requestNewExpense(
  saveAction?: ExpenseSaveAction,
  title?: string,
  reference?: Partial<ExpenseInEditor>,
): Promise<ExpenseInEditor | null> {
  return new Promise<ExpenseInEditor | null>(resolve => {
    useExpenseDialogRequestStore
      .getState()
      .setRequest({ ...reference, expenseId: null, resolve, saveAction, title });
  });
}

export function createNewExpense(values: Partial<ExpenseInEditor>) {
  useExpenseDialogRequestStore.getState().setRequest({ expenseId: null, resolve: noop, values });
}
