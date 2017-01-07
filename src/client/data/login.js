"use strict";

import * as Bacon from "baconjs"
import * as apiConnect from "./api-connect"
import * as state from "./state"

function getLoginFromSession() {
    const token = sessionStorage.getItem("token");
    if (token) {
        const groupId = parseInt(sessionStorage.getItem("groupId"), 10);
        console.log("not logged in but session token exists in sessionStorage", token, "group id", groupId);
        return apiConnect.getSession(token, groupId)
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
    state.setDataFromSession(s);
    sessionStorage.setItem("token", (s && s.token) ? s.token : undefined);
    currentSessionStream.push(s);
});

export const currentSession = currentSessionStream.toProperty();
