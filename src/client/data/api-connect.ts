import * as state from './state';
import * as time from '../../shared/util/time';
import Money from '../../shared/util/money';
import { Session } from '../../shared/types/session';
import { Map } from '../../shared/util/util';
import { AuthenticationError, Error } from '../../shared/types/errors';
import { FetchClient } from '../../shared/util/fetch-client';
const client = new FetchClient(() => fetch);

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

function authHeader(): Map<string> {
    const token = state.get('token');
    return { 'Authorization': `Bearer ${token}` };
}

function get<T>(path, query?: Map<string>): Promise<T> {
    return client.get<T>(path, query, authHeader());
}

function put<T>(path: string, body?: any, query?: Map<string>): Promise<T> {
    return client.put<T>(path, body, query, authHeader());
}

function post<T>(path, body?: any, query?: Map<string>): Promise<T>  {
    return client.post<T>(path, body, query, authHeader());
}

function del<T>(path, data?: any, query?: Map<string>): Promise<T>  {
    return client.del<T>(path, data, query, authHeader());
}

export function login(username: string, password: string): Promise<Session> {
    return client.put<Session>('/api/session', { username, password });
}

export function logout(): Promise<void> {
    return del('/api/session');
}

export function getSession(): Promise<Session> {
    return get<Session>('/api/session');
}

export function refreshSession(): Promise<Session> {
    return put<Session>('/api/session/refresh');
}

export function getExpensesForMonth(year, month) {
    return get('/api/expense/month', { year: year, month: month })
        .then(l => mapExpenseObject(l));
}

export function searchExpenses(startDate, endDate, query) {
    const q = query || {};
    q.startDate = time.date(startDate);
    q.endDate = time.date(endDate);
    return get<any[]>('/api/expense/search', q).then(l => l.map(mapExpense));
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
    return get('/api/expense/receivers', { receiver: receiver });
}

export function getCategoryList(): Promise<any[]> {
    return get('/api/category/list');
}

export function storeCategory(category) {
    return put('/api/category', category);
}

export function getCategoryTotals(startDate, endDate): Promise<any[]> {
    const q = { 
        startDate: time.date(startDate),
        endDate: time.date(endDate),
    };
    return get('/api/category/totals', q);
}

export function updateCategory(id, category) {
    return post(`/api/category/${parseInt(id, 10)}`, category);
}
