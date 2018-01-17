import * as Bacon from 'baconjs';

interface State {
    expenseDialogStream?: Bacon.Bus<any, any>;
    confirmationDialogStream?: Bacon.Bus<any, any>;
    expensesUpdatedStream?: Bacon.Bus<any, any>;
    notificationStream?: Bacon.Bus<any, any>;
    pickDateStream?: Bacon.Bus<any, any>;
    categories?: any;
    categoryMap?: any;
    sources?: any;
    sourceMap?: any;
    users?: any;
    userMap?: any;
    session?: any;
    token?: any;
    user?: any;
    group?: any;
    groups?: any;
};

let state: State = {};
// Export state for debugging
(window as any).state = state;

export function set(name, value) {
    state[name] = value;
}

export function get(name) {
    return state[name];
    }

export function init() {
    state = {};
    // Export state for debugging
    (window as any).state = state;
    state.expenseDialogStream && state.expenseDialogStream.end();
    state.expenseDialogStream = new Bacon.Bus();
    state.confirmationDialogStream && state.confirmationDialogStream.end();
    state.confirmationDialogStream = new Bacon.Bus();
    state.expensesUpdatedStream && state.expensesUpdatedStream.end();
    state.expensesUpdatedStream = new Bacon.Bus();
    state.notificationStream && state.notificationStream.end();
    state.notificationStream = new Bacon.Bus();
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
    state.token = session ? session.token : undefined;
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

export function notify(msg) {
    if (state.notificationStream) state.notificationStream.push(msg);
    return true;
}

export function notifyError(msg, cause) {
    if (state.notificationStream) state.notificationStream.push(msg + ": " + cause);
    return false;
}

export function editExpense(e) {
    if (state.expenseDialogStream) state.expenseDialogStream.push(e);
}

/* Returns a promise that will be resolved to either true of false depending on user input */
export function confirm(title: string, content: string, options: any) {
    options = options ? options : {};
    const actions = options.actions || [
        [options.okText ? options.okText : "OK", true],
            [options.cancelText ? options.cancelText : "Peruuta", false] ];

    let resolve: (() => void) | null = null, reject: (() => void) | null = null;
    const p = new Promise((res, rej) => { resolve = res; reject = rej; });
    if (state.confirmationDialogStream) state.confirmationDialogStream.push({
        title: title,
        content: content,
        actions: actions,
        resolve: resolve,
        reject: reject
    });
    return p;
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
