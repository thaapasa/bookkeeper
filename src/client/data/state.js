const state = {};

export function set(name, value) {
    state[name] = value;
}

export function get(name) {
    return state[name];
}
