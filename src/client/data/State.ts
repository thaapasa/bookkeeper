import * as B from 'baconjs';
import {
  ConfirmationObject,
  ConfirmationAction,
  Notification,
  PickDateObject,
  ExpenseDialogObject,
  NavigationConfig,
} from './StateTypes';
import { DateLike, toDate, monthRange } from 'shared/util/Time';
import { ExpenseInEditor } from 'shared/types/Expense';
import { Size } from '../ui/Types';
import { expensePagePath } from '../util/Links';
import { noop } from 'shared/util/Util';

/* Push event to confirmationBus to show a confirmation dialog */
const confirmationBus = new B.Bus<ConfirmationObject<any>>();

interface ConfirmationSettings<T> {
  okText?: string;
  cancelText?: string;
  actions?: Array<ConfirmationAction<T>>;
}

export const confirmationE = confirmationBus;

/* Returns a promise that will be resolved to either true of false depending on user input */
export function confirm<T>(
  title: string,
  content: string,
  options?: ConfirmationSettings<T>
): Promise<T> {
  return new Promise<T>(resolve => {
    const op = options || {};
    const actions: Array<ConfirmationAction<T>> = op.actions || [
      { label: op.okText ? op.okText : 'OK', value: true as any },
      { label: op.cancelText ? op.cancelText : 'Peruuta', value: false as any },
    ];
    confirmationBus.push({ title, content, actions, resolve });
  });
}

const notificationBus = new B.Bus<Notification>();
export const notificationE = notificationBus;

export function notify(message: string): void {
  notificationBus.push({ message });
}

export function notifyError(message: string, cause: any) {
  notificationBus.push({ message, cause });
}

const pickDateBus = new B.Bus<PickDateObject>();

/* Returns a promise that will be resolved to the selected date  */
export function pickDate(initialDate?: Date): Promise<Date> {
  return new Promise(resolve => pickDateBus.push({ resolve, initialDate }));
}

export const pickDateE = pickDateBus;

const expenseDialogBus = new B.Bus<ExpenseDialogObject>();

export function editExpense(
  expenseId: number
): Promise<ExpenseInEditor | null> {
  return new Promise<ExpenseInEditor | null>(resolve => {
    expenseDialogBus.push({ expenseId, resolve });
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

// Start listening to window size to not miss any updates
windowSizeP.onValue(noop);

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
    windowSizeBus,
    windowSizeP,
  };
}
