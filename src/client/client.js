"use strict";

import React from "react"
import ReactDOM from "react-dom"
import BookkeeperPage from "./ui/page"
import LoginPage from "./ui/loginpage"
import injectTapEventPlugin from "react-tap-event-plugin"
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider"
import * as apiConnect from "./api-connect"
import * as state from  "./state";


function checkLoginState() {
    if (sessionStorage.getItem("token")) {
        console.log("not logged in but session token exists in sessionStorage", sessionStorage.getItem("token"));
        return apiConnect.getSession(sessionStorage.getItem("token"))
            .then(u => {
                console.log("got session", u);
                state.set("currentUser", u);
                sessionStorage.setItem('token', u.token);
                return u;
            })
            .catch(e => undefined);
    }
    else return Promise.resolve(undefined);
}

function setLoginState(u) {
    state.set("currentUser", u);
    renderBookkeeper(u);
}

function init() {
    console.log("init");

    injectTapEventPlugin();

    checkLoginState().then(u => {
        renderBookkeeper(u);
    });

    console.log("done");
}

function renderBookkeeper(u) {
    console.log("renderBookkeeper", u);
    if (u == undefined) {
        console.log("Didn't find current user, rendering loginPage");
        ReactDOM.render(<MuiThemeProvider>
            <LoginPage onLogin={u => setLoginState(u)}/>
        </MuiThemeProvider>, document.getElementById("root"))
    } else {
        console.log("Found currentuser", u.firstname);
        ReactDOM.render(<MuiThemeProvider>
            <BookkeeperPage user={u}/>
            </MuiThemeProvider>, document.getElementById("root"))
    }
}

document.addEventListener("DOMContentLoaded", init);
