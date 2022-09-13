import * as B from 'baconjs';

import { ExpenseInEditor } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { DateLike, toDate } from 'shared/util/Time';
import { monthRange } from 'shared/util/TimeRange';
import { noop } from 'shared/util/Util';

import { Size } from '../ui/Types';
import { expensePagePath } from '../util/Links';
import {
  ExpenseDialogObject,
  NavigationConfig,
  Notification,
  PickDateObject,
} from './StateTypes';

const notificationBus = new B.Bus<Notification>();
export const notificationE = notificationBus;

export function notify(message: string): void {
  notificationBus.push({ message });
}

export function notifyError(message: string, cause: any) {
  notificationBus.push({ message, cause, severity: 'warning' });
}

const pickDateBus = new B.Bus<PickDateObject>();

/* Returns a promise that will be resolved to the selected date  */
export function pickDate(initialDate?: Date): Promise<Date | undefined> {
  return new Promise(resolve => pickDateBus.push({ resolve, initialDate }));
}

export const pickDateE = pickDateBus;

const expenseDialogBus = new B.Bus<ExpenseDialogObject<ExpenseInEditor>>();
const expenseSplitBus = new B.Bus<ExpenseDialogObject<ExpenseSplit[]>>();

export function editExpense(
  expenseId: number
): Promise<ExpenseInEditor | null> {
  return new Promise<ExpenseInEditor | null>(resolve => {
    expenseDialogBus.push({ expenseId, resolve });
  });
}

export function splitExpense(
  expenseId: number
): Promise<ExpenseSplit[] | null> {
  return new Promise<ExpenseSplit[] | null>(resolve => {
    expenseSplitBus.push({ expenseId, resolve });
  });
}

export function createExpense(
  event?: React.MouseEvent<any>
): Promise<ExpenseInEditor | null> {
  if (event) {
    event.stopPropagation();
  }
  return new Promise<ExpenseInEditor | null>(resolve => {
    expenseDialogBus.push({ expenseId: null, resolve });
  });
}

export const expenseDialogE = expenseDialogBus;
export const expenseSplitE = expenseSplitBus;

const needUpdateBus = new B.Bus<Date>();

export function updateExpenses(date: DateLike) {
  needUpdateBus.push(toDate(date));
  return true;
}

export function createNewExpense(values: Partial<ExpenseInEditor>) {
  expenseDialogE.push({ expenseId: null, resolve: noop, values });
}

export const needUpdateE = needUpdateBus;

export const navigationBus = new B.Bus<NavigationConfig>();
export const navigationP = navigationBus.toProperty({
  pathPrefix: expensePagePath,
  dateRange: monthRange(new Date()),
});

export const windowSizeBus = new B.Bus<Size>();
export const windowSizeP = windowSizeBus.toProperty();

// Start listening to buses to not miss any updates
windowSizeP.onValue(noop);
navigationP.onValue(noop);

/* Export state to window globals for debugging */
if (process.env.NODE_ENV === 'development') {
  (window as any).state = {
    notificationBus,
    notificationE,
    pickDateBus,
    pickDateE,
    expenseDialogBus,
    expenseDialogE,
    needUpdateBus,
    needUpdateE,
    windowSizeBus,
    windowSizeP,
  };
}
