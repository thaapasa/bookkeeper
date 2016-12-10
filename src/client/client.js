"use strict";

import React from "react"
import ReactDOM from "react-dom"
import BookkeeperPage from "./ui/page"
import injectTapEventPlugin from "react-tap-event-plugin"
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider"


function init() {
    console.log("init");

    injectTapEventPlugin();

    renderBookkeeper();
    console.log("done");
}

function renderBookkeeper() {
    console.log("renderBookkeeper");
    ReactDOM.render(<MuiThemeProvider>
        <BookkeeperPage />
    </MuiThemeProvider>, document.getElementById("root"))
}

document.addEventListener("DOMContentLoaded", init);
