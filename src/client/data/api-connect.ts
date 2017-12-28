"use strict";

import Promise from "bluebird";
import * as state from "./state";
import * as time from "../../shared/util/time";
const request = Promise.promisifyAll(require("superagent"));
const Money = require("../../shared/util/money");

function mapExpense(e) {
    e.userBenefit = Money.from(e.userBenefit, 0);
    e.userCost = Money.from(e.userCost, 0);
    e.userBalance = Money.from(e.userBalance, 0);
    e.userIncome = Money.from(e.userIncome, 0);
    e.userSplit = Money.from(e.userSplit, 0);
    return e;
}

function mapStatus(s) {
    return {
        cost: Money.from(s.cost),
        benefit: Money.from(s.benefit),
        income: Money.from(s.income),
        split: Money.from(s.split),
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


function get(path, query?: any) {
    const token = state.get("token");
    return request.get(path)
        .query(query ? query : {})
        .set("Authorization", `Bearer ${token}`)
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

function put(path, data?: any, query?: any) {
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

function post(path, data?: any, query?: any) {
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

function del(path, data?: any, query?: any) {
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

export function login(username, password) {
    const url = '/api/session';

    return request.put(url)
        .set('Content-Type', 'application/json')
        .send({username: username, password: password})
        .endAsync()
        .then(req => req.body)
        .catch(defaultErrorHandler);
}

export function logout() {
    return del("/api/session");
}

export function getSession() {
    return get("/api/session");
}

export function refreshSession() {
    return put("/api/session/refresh");
}

export function getExpensesForMonth(year, month) {
    return get("/api/expense/month", { year: year, month: month })
        .then(l => mapExpenseObject(l));
}

export function searchExpenses(startDate, endDate, query) {
    const q = query || {};
    q.startDate = time.date(startDate);
    q.endDate = time.date(endDate);
    return get("/api/expense/search", q).then(l => l.map(mapExpense));
}

export function getExpense(id) {
    return get(`/api/expense/${parseInt(id, 10)}`).then(mapExpense);
}

export function storeExpense(expense) {
    return put("/api/expense", expense);
}

export function updateExpense(id, expense) {
    return post(`/api/expense/${parseInt(id, 10)}`, expense);
}

export function deleteExpense(id) {
    return del(`/api/expense/${parseInt(id, 10)}`);
}

export function createRecurring(id, period) {
    return put(`/api/expense/recurring/${parseInt(id, 10)}`, { period: period });
}

export function queryReceivers(receiver) {
    return get("/api/expense/receivers", { receiver: receiver });
}

export function getCategoryList() {
    return get("/api/category/list");
}

export function storeCategory(category) {
    return put("/api/category", category);
}

export function getCategoryTotals(startDate, endDate) {
    const q = { 
        startDate: time.date(startDate),
        endDate: time.date(endDate),
    };
    return get("/api/category/totals", q);
}

export function updateCategory(id, category) {
    return post(`/api/category/${parseInt(id, 10)}`, category);
}

function defaultErrorHandler(er) {
    console.log("Error in api-connect:", er);
    throw er;
}
