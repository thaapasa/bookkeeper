"use strict";

const users = require("./data/users");
const moment = require("moment");
const express = require("express");
const sessions = require("./data/sessions");
const expenses = require("./data/expenses");
const config = require("./config");
const server = require("./util/server-util");
const Promise = require("bluebird");
const validator = require("./util/validator");

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

    // GET /api/session/groups
    app.get("/api/session/groups", server.processRequest(session =>
        users.getGroups(session.user.id)));


    // GET /api/user/list
    app.get("/api/user/list", server.processRequest((session, req) =>
        users.getAll()));

    // GET /api/user/[userid]
    const userPath = /\/api\/user\/([0-9]+)/;
    app.get(userPath, server.processRequest((session, req) =>
        users.getById(server.getId(userPath, req))));


    // GET /api/expense/list
    app.get("/api/expense/list", server.processRequest(session =>
        expenses.getAll(session.group.id), true));

    // GET /api/expense/month
    const monthSchema = {
        year: validator.intBetween(1500, 3000),
        month: validator.intBetween(1, 12)
    };
    app.get("/api/expense/month", server.processRequest((session, req) => {
        const params = validator.validate(monthSchema, { year: req.query.year, month: req.query.month });
        return expenses.getByMonth(session.group.id, params.year, params.month);
    }, true));

    // PUT /api/expense
    const expenseSchema = {
        date: validator.matchPattern(/[0-9]{4}-[0-9]{2}-[0-9]{2}/),
        receiver: validator.stringWithLength(1, 50),
        sum: validator.money,
        description: validator.stringWithLength(1, 255),
        source: validator.stringWithLength(1, 50),
        category: validator.stringWithLength(1, 50),
        benefit: validator.listOfObjects({ userId: validator.positiveInt, sum: validator.money }),
        cost: validator.listOfObjects({ userId: validator.positiveInt, sum: validator.money })
    };
    app.put("/api/expense", server.processRequest((session, req) =>
        expenses.create(session.user.id, session.group.id, validator.validate(expenseSchema, req.body)), true));

    // GET /api/expense/[expenseId]
    const expensePath = /\/api\/expense\/([0-9]+)/;
    app.get(expensePath, server.processRequest((session, req) =>
        expenses.getById(session.group.id, server.getId(expensePath, req)), true));

    // DELETE /api/expense/[expenseId]
    app.delete(expensePath, server.processRequest((session, req) =>
        expenses.deleteById(session.group.id, server.getId(expensePath, req)), true));

}

module.exports = {
    registerAPI: registerAPI
};
