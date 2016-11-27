"use strict";

import React from "react"
import ReactDOM from "react-dom"
import BookkeeperPage from "./ui/page"



function init() {
    console.log("init");


    renderBookkeeper();
    console.log("done");
}

function renderBookkeeper() {
    console.log("renderBookkeeper");
    ReactDOM.render(/*<MuiThemeProvider>*/
        <BookkeeperPage />
    /*</MuiThemeProvider>*/, document.getElementById("root"))
}


document.addEventListener("DOMContentLoaded", init)
