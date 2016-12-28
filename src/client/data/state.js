import * as Bacon from "baconjs"

let state = {};

export function set(name, value) {
    state[name] = value;
}

export function get(name) {
    return state[name];
}

export function init() {
    state = {};
    state.expenseDialogStream = new Bacon.Bus();
}
