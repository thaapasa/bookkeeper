import * as Bacon from "baconjs"

let state = {};
// Export state for debugging
window.state = state;

export function set(name, value) {
    state[name] = value;
}

export function get(name) {
    return state[name];
}

export function init() {
    state = {};
    // Export state for debugging
    window.state = state;
    state.expenseDialogStream && state.expenseDialogStream.end();
    state.expenseDialogStream = new Bacon.Bus();
    state.confirmationDialogStream && state.confirmationDialogStream.end();
    state.confirmationDialogStream = new Bacon.Bus();
    state.expensesUpdatedStream && state.expensesUpdatedStream.end();
    state.expensesUpdatedStream = new Bacon.Bus();
    state.notificationStream && state.notificationStream.end();
    state.notificationStream = new Bacon.Bus();
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
    state.notificationStream.push(msg);
}

export function notifyError(msg, cause) {
    state.notificationStream.push(msg + ": " + cause);
}

export function editExpense(e) {
    state.expenseDialogStream.push(e);
}

/* Returns a promise that will be resolved to either true of false depending on user input */
export function confirm(title, content, okText = "OK", cancelText = "Peruuta") {
    let resolve = null, reject = null;
    const p = new Promise((res, rej) => { resolve = res; reject = rej; });
    state.confirmationDialogStream.push({
        title: title,
        content: content,
        okText: okText,
        cancelText: cancelText,
        resolve: resolve,
        reject: reject
    });
    return p;
}
