"use strict";

import * as Bacon from "baconjs"
import * as apiConnect from "./api-connect"
import * as state from "./state"

function getLoginFromSession() {
    const token = localStorage.getItem("refreshToken");
    if (token) {
        console.log("Not logged in but refresh token exists in localStorage", token);
        state.set("token", token);
        return apiConnect.refreshSession()
            .catch(e => undefined);
    }
    else return Promise.resolve(undefined);
}

export function checkLoginState() {
    return getLoginFromSession()
        .then(u => { loginStream.push(u); return u; })
}

export function logout() {
    const session = state.get("session");
    return (session && session.token ?
        apiConnect.logout()
            .then(s => loginStream.push(undefined)) :
        Promise.resolve(true));
}

export const loginStream = new Bacon.Bus();
const currentSessionStream = new Bacon.Bus();
loginStream.onValue(s => {
    console.log("Current session", s);
    state.init();
    state.setDataFromSession(s);
    s && s.refreshToken ? localStorage.setItem("refreshToken", s.refreshToken) : localStorage.removeItem("refreshToken");
    document.title = state.getTitle();
    currentSessionStream.push(s);
});

export const currentSession = currentSessionStream.toProperty();
