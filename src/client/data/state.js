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

export function setCategories(categories) {
    state.categories = categories ? categories : undefined;
    state.categoryMap = new Map();
    categories.forEach(c => {
        state.categoryMap.set(c.id, c);
        c.children && c.children.forEach(ch => {state.categoryMap.set(ch.id, ch);});
    });
}

export function setDataFromSession(session) {
    init();
    state.session = session;
    state.token = session ? session.token : undefined;
    state.user = session ? session.user : undefined;
    state.group = session ? session.group : undefined;
    session && setCategories(session.categories);
    state.sources = session ? session.sources : [];
    state.groups = session ? session.groups : [];
    state.users = session ? session.users : [];
}
