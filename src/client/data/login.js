"use strict";

import * as Bacon from "baconjs"
import * as apiConnect from "./api-connect"
import * as state from "./state"

function getLoginFromSession() {
    if (sessionStorage.getItem("token")) {
        console.log("not logged in but session token exists in sessionStorage", sessionStorage.getItem("token"));
        return apiConnect.getSession(sessionStorage.getItem("token"))
            .catch(e => undefined);
    }
    else return Promise.resolve(undefined);
}

export function checkLoginState() {
    return getLoginFromSession()
        .then(u => { loginStream.push(u); return u; })
}

export const loginStream = new Bacon.Bus();
const currentSessionStream = new Bacon.Bus();
loginStream.onValue(s => {
    console.log("Current session", s);
    state.init();
    state.set("currentUser", s);
    sessionStorage.setItem("token", (s && s.token) ? s.token : undefined);
    currentSessionStream.push(s);
});

export const currentSession = currentSessionStream.toProperty();
