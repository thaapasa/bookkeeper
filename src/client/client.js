"use strict";

import React from "react"
import ReactDOM from "react-dom"
import BookkeeperPage from "./ui/page"
import LoginPage from "./ui/login-page"
import injectTapEventPlugin from "react-tap-event-plugin"
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider"
import * as login from "./data/login"
import * as log from "../shared/util/log"

window.log = log;

function init() {
    injectTapEventPlugin();
    renderBookkeeper();
}

function renderBookkeeper() {
    ReactDOM.render(
        <MuiThemeProvider>
            <Bookkeeper />
        </MuiThemeProvider>, document.getElementById("root"))
}

class Bookkeeper extends React.Component {

    constructor(props) {
        super(props);
        log.info("Initializing bookkeeper client");
        this.state = { session: undefined, initialized: false };
    }

    componentDidMount() {
        login.currentSession.onValue(u => this.setState({ session: u }));
        login.checkLoginState().then(() => this.setState({ initialized: true }));
    }

    render() {
        return (this.state.initialized) ?
            ((this.state.session === undefined) ? <LoginPage /> : <BookkeeperPage session={ this.state.session } />) :
            <div />;
    }
}


document.addEventListener("DOMContentLoaded", init);
