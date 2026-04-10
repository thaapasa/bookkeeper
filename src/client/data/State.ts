import * as B from 'baconjs';

import { ExpenseInEditor, ExpenseSplit } from 'shared/expense';
import { ISODate, monthRange, toISODate } from 'shared/time';
import { noop } from 'shared/util';
import { ExpenseSaveAction } from 'client/ui/expense/dialog/ExpenseSaveAction';

import { expensePagePath } from '../util/Links';
import type { ExpenseDialogObject, NavigationConfig, Notification } from './StateTypes';

const notificationBus = new B.Bus<Notification>();
export const notificationE = notificationBus;

export function notify(message: string, params?: Partial<Notification>): void {
  notificationBus.push({ message, ...params });
}

export function notifyError(message: string, cause: unknown, params?: Partial<Notification>) {
  notificationBus.push({ message, cause, severity: 'warning', ...params });
}

const expenseDialogBus = new B.Bus<ExpenseDialogObject<ExpenseInEditor>>();
const expenseSplitBus = new B.Bus<ExpenseDialogObject<ExpenseSplit[]>>();

export function editExpense(
  expenseId: number,
  options?: Partial<ExpenseDialogObject<ExpenseInEditor>>,
): Promise<ExpenseInEditor | null> {
  return new Promise<ExpenseInEditor | null>(resolve => {
    expenseDialogBus.push({ ...options, expenseId, resolve });
  });
}

export function splitExpense(expenseId: number): Promise<ExpenseSplit[] | null> {
  return new Promise<ExpenseSplit[] | null>(resolve => {
    expenseSplitBus.push({ expenseId, resolve });
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
    expenseDialogBus.push({ ...reference, expenseId: null, resolve, saveAction, title });
  });
}

export const expenseDialogE = expenseDialogBus;
export const expenseSplitE = expenseSplitBus;

const expenseNavigationBus = new B.Bus<ISODate>();
export const expenseNavigationE = expenseNavigationBus;

/** Push a date to trigger cross-month navigation in MonthView. */
export function navigateToExpenseDate(date: ISODate) {
  expenseNavigationBus.push(date);
}

export function createNewExpense(values: Partial<ExpenseInEditor>) {
  expenseDialogE.push({ expenseId: null, resolve: noop, values });
}

export const navigationBus = new B.Bus<NavigationConfig>();
export const navigationP = navigationBus.toProperty({
  pathPrefix: expensePagePath,
  dateRange: monthRange(toISODate()),
});

// Start listening to buses to not miss any updates
navigationP.onValue(noop);

/* Export state to window globals for debugging */
if (import.meta.env.NODE_ENV === 'development') {
  (window as any).state = {
    notificationBus,
    notificationE,
    expenseDialogBus,
    expenseDialogE,
  };
}
