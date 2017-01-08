"use strict";

import Promise from "bluebird";
const request = Promise.promisifyAll(require("superagent"));
import * as state from "./state";

function get(path, query) {
    const token = state.get("token");
    return request.get(path)
        .query(query ? query : {})
        .set("Authorization", `Bearer ${token}`)
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

function put(path, data, query) {
    const token = state.get("token");
    return request.put(path)
        .query(query ? query : {})
        .set("Content-Type", "application/json")
        .set("Authorization", `Bearer ${token}`)
        .send(data)
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

function login(username, password) {
    const url = '/api/session';

    return request.put(url)
        .set('Content-Type', 'application/json')
        .send({username: username, password: password})
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

function getSession() {
    return get("/api/session");
}

function getExpenses(year, month) {
    return get("/api/expense/month", { year: year, month: month });
}

function storeExpense(expense) {
    return put("/api/expense", expense);
}

function defaultErrorHandler(er) {
    console.log("Error in api-connect:", er);
    throw er;
}

module.exports = {login : login, getSession : getSession, getExpenses : getExpenses, storeExpense : storeExpense };
