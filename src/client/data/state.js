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
    state.expenseDialogStream = new Bacon.Bus();
}

export function setDataFromSession(session) {
    init();
    state.session = session;
    state.user = session.user;
    state.categories = session.categories;
    state.sources = session.sources;
    state.groups = session.groups;
    state.users = session.users;
}
