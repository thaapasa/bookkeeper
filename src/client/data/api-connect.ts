import * as state from './state';
import * as time from '../../shared/util/time';
import Money from '../../shared/util/money';
import { Session } from '../../shared/types/session';
import { Map } from '../../shared/util/util';
import { AuthenticationError, Error } from '../../shared/types/errors';
const debug = require('debug')('bookkeeper:api-connect');

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

function toQuery(path: string, query?: Map<string>): string {
    return query ? path + '?' +
        Object.keys(query)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(query[k])).join('&')
        : path;
}

async function req(path, { method, query, body, headers }: 
    { method: string, query?: Map<string>, body?: any, headers?: Map<string> }): Promise<any> {
    try {
        const token = state.get('token');
        const queryPath = toQuery(path, query);
        debug(`${method} ${queryPath} with body`, body);
        const res = await fetch(queryPath, {
            method: method,
            body: body ? JSON.stringify(body) : undefined,
            headers: { ...headers, 'Authorization': `Bearer ${token}` }
        });
        switch (res.status) {
            case 200: return res.json();
            case 401: 
            case 403: throw new AuthenticationError('Unauthorized: ' + res.status, await res.json());
            default: throw new Error('Error in api-connec', await res.json(), res.status);
        }
    } catch (e) {
        debug("Error in api-connect:", e);
        throw e;
    }
}

const contentTypeJson = { 'Content-Type': 'application/json' };

function get(path, query?: Map<string>) {
    return req(path, { method: 'GET', query });
}

function put(path: string, body?: any, query?: Map<string>): Promise<any>  {
    return req(path, { method: 'PUT', body, query, headers: contentTypeJson });
}

function post(path, body?: any, query?: Map<string>): Promise<any>  {
    return req(path, { method: 'POST', body, query, headers: contentTypeJson });
}

function del(path, data?: any, query?: Map<string>): Promise<any>  {
    return req(path, { method: 'DELETE', query });
}

export function login(username: string, password: string): Promise<Session> {
    const url = '/api/session';
    return req(url, { method: 'PUT', body: { username, password }, headers: contentTypeJson });
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
