"use strict";

const users = require("./data/users");
const moment = require("moment");
const express = require("express");
const sessions = require("./data/sessions");
const expenses = require("./data/expenses");
const config = require("./config");
const server = require("./util/server-util");
const Promise = require("bluebird");

function registerAPI(app) {

    // GET /api/status
    app.get("/api/status", server.processUnauthorizedRequest(req => Promise.resolve({
        status: "OK",
        timestamp: moment().format(),
        version: config.version,
        revision: config.revision,
        environment: config.environment
    })));


    // PUT /api/session
    app.put("/api/session", server.processUnauthorizedRequest(req =>
        sessions.login(req.body.username, req.body.password)));

    // GET /api/session
    app.get("/api/session", server.processRequest(session =>
        Promise.resolve(session)));

    // DELETE /api/session
    app.delete("/api/session", server.processRequest(session =>
        sessions.logout(session)));


    // GET /api/user/list
    app.get("/api/user/list", server.processRequest((session, req) =>
        users.getAll()));

    // GET /api/user/[userid]
    const userPath = /\/api\/user\/([0-9]+)/;
    app.get(userPath, server.processRequest((session, req) =>
        users.getById(server.getId(userPath, req))));


    // GET /api/expense/list
    app.get("/api/expense/list", server.processRequest(session =>
        expenses.getAll(session.user.id)));

    // PUT /api/expense
    app.put("/api/expense", server.processRequest((session, req) =>
        expenses.create(session.user.id, req.body)));

    // GET /api/expense/[expenseId]
    const expensePath = /\/api\/expense\/([0-9]+)/;
    app.get(expensePath, server.processRequest((session, req) =>
        expenses.getById(session.user.id, server.getId(expensePath, req))));

    // DELETE /api/expense/[expenseId]
    app.delete(expensePath, server.processRequest((session, req) =>
        expenses.deleteById(session.user.id, server.getId(expensePath, req))));

}

module.exports = {
    registerAPI: registerAPI
};
