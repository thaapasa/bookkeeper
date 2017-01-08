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
}

export function setDataFromSession(session) {
    init();
    state.session = session;
    state.token = session ? session.token : undefined;
    state.user = session ? session.user : undefined;
    state.categories = session ? session.categories : [];
    state.sources = session ? session.sources : [];
    state.groups = session ? session.groups : [];
    state.users = session ? session.users : [];
}
