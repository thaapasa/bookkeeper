"use strict";

import Promise from "bluebird";
const request = Promise.promisifyAll(require("superagent"));
import * as state from "./state";
const Money = require("../../shared/util/money");

function mapExpense(e) {
    e.userBenefit = Money.from(e.userBenefit, 0);
    e.userCost = Money.from(e.userCost, 0);
    e.userBalance = Money.from(e.userBalance, 0);
    return e;
}

function mapStatus(s) {
    return {
        cost: Money.from(s.cost),
        benefit: Money.from(s.benefit),
        value: Money.from(s.value),
        balance: Money.from(s.balance)
    }
}

function mapExpenseObject(e) {
    e.expenses = e.expenses.map(mapExpense);
    e.startStatus = mapStatus(e.startStatus);
    e.endStatus = mapStatus(e.endStatus);
    e.monthStatus = mapStatus(e.monthStatus);
    return e;
}


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

function post(path, data, query) {
    const token = state.get("token");
    return request.post(path)
        .query(query ? query : {})
        .set("Content-Type", "application/json")
        .set("Authorization", `Bearer ${token}`)
        .send(data)
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

function del(path, data, query) {
    const token = state.get("token");
    return request.delete(path)
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

function logout() {
    return del("/api/session");
}

function getSession() {
    return get("/api/session");
}

function getExpensesForMonth(year, month) {
    return get("/api/expense/month", { year: year, month: month })
        .then(l => mapExpenseObject(l));
}

function getExpense(id) {
    return get(`/api/expense/${parseInt(id, 10)}`).then(mapExpense);
}

function storeExpense(expense) {
    return put("/api/expense", expense);
}

function updateExpense(id, expense) {
    return post(`/api/expense/${parseInt(id, 10)}`, expense);
}

function deleteExpense(id) {
    return del(`/api/expense/${parseInt(id, 10)}`);
}

function defaultErrorHandler(er) {
    console.log("Error in api-connect:", er);
    throw er;
}

module.exports = {
    login : login, logout : logout, getSession : getSession,
    getExpensesForMonth : getExpensesForMonth, getExpense: getExpense, storeExpense : storeExpense, deleteExpense: deleteExpense, updateExpense: updateExpense
};
