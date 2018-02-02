import * as Bacon from 'baconjs';
import { ConfirmationObject, ConfirmationAction, Notification } from './StateTypes';

/* Push event to confirmationBus to show a confirmation dialog */
const confirmationBus = new Bacon.Bus<any, ConfirmationObject<any>>();

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

const notificationBus = new Bacon.Bus<any, Notification>();
export const notificationE = notificationBus;

export function notify(message: string): void {
  notificationBus.push({ message });
}

export function notifyError(message: string, cause: any) {
  notificationBus.push({ message, cause });
}

/* Export state to window globals for debugging */
if (process.env.NODE_ENV === 'development') {
  (window as any).state = {
    confirmationBus,
    confirmationE,
    notificationBus,
    notificationE,
  };
}

/** Old state */
interface State {
  expenseDialogStream?: Bacon.Bus<any, any>;
  expensesUpdatedStream?: Bacon.Bus<any, any>;
  pickDateStream?: Bacon.Bus<any, any>;
  categories?: any;
  categoryMap?: any;
  sources?: any;
  sourceMap?: any;
  users?: any;
  userMap?: any;
  session?: any;
  user?: any;
  group?: any;
  groups?: any;
};

let state: State = {};

export function set(name, value) {
  state[name] = value;
}

export function get(name) {
  return state[name];
}

export function init() {
  state = {};
  state.expenseDialogStream && state.expenseDialogStream.end();
  state.expenseDialogStream = new Bacon.Bus();
  state.expensesUpdatedStream && state.expensesUpdatedStream.end();
  state.expensesUpdatedStream = new Bacon.Bus();
  state.pickDateStream && state.pickDateStream.end();
  state.pickDateStream = new Bacon.Bus();
}

export function setCategories(categories) {
  state.categories = categories ? categories : undefined;
  state.categoryMap = {};
  categories && categories.forEach(c => {
    state.categoryMap[c.id] = c;
    c.children && c.children.forEach(ch => state.categoryMap[ch.id] = ch);
  });
}

export function setSources(sources) {
  state.sources = sources ? sources : undefined;
  state.sourceMap = {};
  sources && sources.forEach(c => {
    state.sourceMap[c.id] = c;
  });
}

export function setUsers(users) {
  state.users = users ? users : undefined;
  state.userMap = {};
  users && users.forEach(c => {
    state.userMap[c.id] = c;
  });
}

export function setDataFromSession(session) {
  init();
  state.session = session;
  state.user = session ? session.user : undefined;
  state.group = session ? session.group : undefined;
  setCategories(session ? session.categories : undefined);
  setSources(session ? session.sources : undefined);
  setUsers(session ? session.users : undefined);
  state.groups = session ? session.groups : [];
}

export function getTitle() {
  const groupName = state.group && state.group.name;
  return groupName ? `Kukkaro - ${groupName}` : "Kukkaro";
}

export function editExpense(e) {
  if (state.expenseDialogStream) state.expenseDialogStream.push(e);
}


export function updateExpenses(date) {
  if (state.expensesUpdatedStream) state.expensesUpdatedStream.push(date);
  return true;
}

/* Returns a promise that will be resolved to the selected date  */
export function pickDate(currentValue): Promise<Date> {
  let resolve: ((Date) => void) | null = null, reject: (() => void) | null = null;
  const p = new Promise((res: (Date) => void, rej) => { resolve = res; reject = rej; });
  if (state.pickDateStream) state.pickDateStream.push({
    date: currentValue,
    resolve: resolve,
    reject: reject
  });
  return p;
}