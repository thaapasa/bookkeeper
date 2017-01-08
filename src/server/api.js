"use strict";

const users = require("./data/users");
const moment = require("moment");
const express = require("express");
const sessions = require("./data/sessions");
const expenses = require("./data/expenses");
const categories = require("./data/categories");
const sources = require("./data/sources");
const config = require("./config");
const server = require("./util/server-util");
const Promise = require("bluebird");
const V = require("./util/validator");

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
        sessions.login(req.body.username, req.body.password, req.query.groupId)
            .then(sessions.appendInfo)));

    // GET /api/session
    app.get("/api/session", server.processRequest(sessions.appendInfo));

    // DELETE /api/session
    app.delete("/api/session", server.processRequest(session =>
        sessions.logout(session)));

    // GET /api/session/groups
    app.get("/api/session/groups", server.processRequest(session =>
        users.getGroups(session.user.id)));


    // GET /api/user/list
    app.get("/api/user/list", server.processRequest((session, req) =>
        users.getAll(session.group.id), true));

    // GET /api/user/[userid]
    const userPath = /\/api\/user\/([0-9]+)/;
    app.get(userPath, server.processRequest((session, req) =>
        users.getById(session.group.id, server.getId(userPath, req)), true));



    // GET /api/category/list
    app.get("/api/category/list", server.processRequest(session =>
        categories.getAll(session.group.id), true));

    // GET /api/category/categoryId
    const categoryPath = /\/api\/category\/([0-9]+)/;
    app.get(categoryPath, server.processRequest((session, req) =>
        categories.getById(session.group.id, server.getId(categoryPath, req)), true));


    // GET /api/source/list
    app.get("/api/source/list", server.processRequest(session =>
        sources.getAll(session.group.id), true));


    // GET /api/expense/list
    app.get("/api/expense/list", server.processRequest(session =>
        expenses.getAll(session.group.id), true));

    // GET /api/expense/month
    const monthSchema = {
        year: V.intBetween(1500, 3000),
        month: V.intBetween(1, 12)
    };
    app.get("/api/expense/month", server.processRequest((session, req) => {
        const params = V.validate(monthSchema, { year: req.query.year, month: req.query.month });
        return expenses.getByMonth(session.group.id, params.year, params.month);
    }, true));

    // PUT /api/expense
    const expenseSchema = {
        userId: V.positiveInt,
        date: V.matchPattern(/[0-9]{4}-[0-9]{2}-[0-9]{2}/),
        receiver: V.stringWithLength(1, 50),
        sum: V.money,
        description: V.stringWithLength(1, 255),
        sourceId: V.optional(V.positiveInt),
        categoryId: V.positiveInt,
        benefit: V.optional(V.listOfObjects({ userId: V.positiveInt, sum: V.money })),
        cost: V.optional(V.listOfObjects({ userId: V.positiveInt, sum: V.money }))
    };
    app.put("/api/expense", server.processRequest((session, req) =>
        expenses.create(session.user.id, session.group.id, V.validate(expenseSchema, req.body), session.group.defaultSourceId), true));

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
