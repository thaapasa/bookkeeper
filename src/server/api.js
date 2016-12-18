"use strict";

const users = require("./data/users");
const moment = require("moment");
const express = require("express");
const sessions = require("./data/sessions");
const config = require("./config");
const server = require("./util/server-util");
const Promise = require("bluebird");

function registerAPI(app) {

    // GET /api/isalive
    app.get("/api/isalive", server.processUnauthorizedRequest(req =>
        Promise.resolve({status: "OK", timestamp: moment().format()})));


    // PUT /api/session
    app.put("/api/session", server.processUnauthorizedRequest(req =>
        sessions.login(req.body.username, req.body.password)));

    // DELETE /api/session
    app.delete("/api/session", server.processRequest((user, req) =>
        Promise.resolve({})));


    // GET /api/user/list
    app.get("/api/user/list", server.processRequest((user, req) =>
        users.getAll()));

    // GET /api/user/[userid]
    const userPath = /\/api\/user\/([0-9]+)/;
    app.get(userPath, server.processRequest((user, req) =>
        users.getById(parseInt(userPath.exec(req.url)[1], 10))));


    // GET /api/expense/list
    app.get("/api/expense/list", server.processRequest(user =>
        Promise.resolve(user)));

    // PUT /api/expense
    app.put("/api/expense", server.processRequest((user, req) =>
        Promise.resolve("OK")));

}

module.exports = {
    registerAPI: registerAPI
};
