"use strict";

const users = require("./data/users");
const moment = require("moment");
const express = require("express");
const sessionHandler = require("./data/sessions");
const config = require("./config");
const server = require("./util/server-util");

function registerAPI(app) {


    app.get("/api/isalive", server.processJson(req => {
        return {status: "OK", timestamp: moment().format()}
    }));

    app.get("/api/user/list", server.processJson(req => users.getAll()));

    const userPath = /\/api\/user\/([0-9]+)/;
    app.get(userPath, server.processJson(req => users.getById(parseInt(userPath.exec(req.url)[1], 10))));

    app.get("/api/expense/list", server.processJson(req => {}));

    app.put("/api/session", server.processJson(req => sessionHandler.login(req.body.username, req.body.password)));

    app.delete("/api/session", server.processJson(req => {}));

    /**
     * Store new expense paid by user
     * @param {string} user
     * @param {number} amount
     */
    app.put("/api/expense", server.processJson(req => "OK"));

}

module.exports = {
    registerAPI: registerAPI
};
