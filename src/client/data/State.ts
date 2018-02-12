import * as B from 'baconjs';
import { ConfirmationObject, ConfirmationAction, Notification, PickDateObject, ExpenseDialogObject } from './StateTypes';
import { DateLike, toDate } from 'shared/util/Time';
import { UserExpenseWithDetails, ExpenseInEditor } from 'shared/types/Expense';

/* Push event to confirmationBus to show a confirmation dialog */
const confirmationBus = new B.Bus<any, ConfirmationObject<any>>();

interface ConfirmationSettings<T> {
  okText?: string;
  cancelText?: string;
  actions?: ConfirmationAction<T>[];
}

export const confirmationE = confirmationBus;

/* Returns a promise that will be resolved to either true of false depending on user input */
export function confirm<T>(title: string, content: string, options?: ConfirmationSettings<T>): Promise<T> {
  return new Promise<T>((resolve) => {
    const op = options ||  {};
    const actions: ConfirmationAction<T>[] = op.actions || [
      { label: op.okText ? op.okText : 'OK', value: true as any },
      { label: op.cancelText ? op.cancelText : 'Peruuta', value: false as any },
    ];
    confirmationBus.push({ title, content, actions, resolve });
  });
}

const notificationBus = new B.Bus<any, Notification>();
export const notificationE = notificationBus;

export function notify(message: string): void {
  notificationBus.push({ message });
}

export function notifyError(message: string, cause: any) {
  notificationBus.push({ message, cause });
}

const pickDateBus = new B.Bus<any, PickDateObject>();

/* Returns a promise that will be resolved to the selected date  */
export function pickDate(initialDate?: Date): Promise<Date> {
  return new Promise((resolve) => pickDateBus.push({ resolve, initialDate }));
}

export const pickDateE = pickDateBus;

const expenseDialogBus = new B.Bus<any, ExpenseDialogObject>();

export function editExpense(expenseId: number): Promise<ExpenseInEditor | null> {
  return new Promise<ExpenseInEditor | null>(resolve => {
    expenseDialogBus.push({ expenseId, resolve });
  });
}

export function createExpense(): Promise<ExpenseInEditor | null> {
  return new Promise<ExpenseInEditor | null>(resolve => {
    expenseDialogBus.push({ expenseId: null, resolve });
  });
}

export const expenseDialogE = expenseDialogBus;

const needUpdateBus = new B.Bus<any, Date>();

export function updateExpenses(date: DateLike) {
  needUpdateBus.push(toDate(date));
  return true;
}

export const needUpdateE = needUpdateBus;

/* Export state to window globals for debugging */
if (process.env.NODE_ENV === 'development') {
  (window as any).state = {
    confirmationBus,
    confirmationE,
    notificationBus,
    notificationE,
    pickDateBus,
    pickDateE,
    expenseDialogBus,
    expenseDialogE,
    needUpdateBus,
    needUpdateE,
  };
}
