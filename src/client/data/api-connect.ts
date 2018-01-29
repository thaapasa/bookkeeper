import * as state from './state';
import * as time from '../../shared/util/time';
import Money from '../../shared/util/money';
import { Session, Category, CategoryAndTotals, CategoryData } from '../../shared/types/session';
import { Map } from '../../shared/util/util';
import { FetchClient } from '../../shared/util/fetch-client';
import { ApiMessage } from '../../shared/types/api';
import { ExpenseCollection, ExpenseStatus, Expense, UserExpense, RecurringExpensePeriod } from '../../shared/types/expense';
const client = new FetchClient(() => fetch);

function mapExpense(e: UserExpense): UserExpense {
    e.userBenefit = Money.from(e.userBenefit, 0);
    e.userCost = Money.from(e.userCost, 0);
    e.userBalance = Money.from(e.userBalance, 0);
    e.userIncome = Money.from(e.userIncome, 0);
    e.userSplit = Money.from(e.userSplit, 0);
    return e;
}

function mapStatus(s: ExpenseStatus): ExpenseStatus {
    return {
        cost: Money.from(s.cost),
        benefit: Money.from(s.benefit),
        income: Money.from(s.income),
        split: Money.from(s.split),
        value: Money.from(s.value),
        balance: Money.from(s.balance)
    }
}

function mapExpenseObject(e: ExpenseCollection): ExpenseCollection {
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

export function logout(): Promise<ApiMessage> {
    return del<ApiMessage>('/api/session');
}

export function getSession(): Promise<Session> {
    return get<Session>('/api/session');
}

export function refreshSession(): Promise<Session> {
    return put<Session>('/api/session/refresh');
}

export async function getExpensesForMonth(year, month): Promise<ExpenseCollection> {
    const collection = await get<ExpenseCollection>('/api/expense/month', { year: year, month: month })
    return mapExpenseObject(collection);
}

export function searchExpenses(startDate, endDate, query): Promise<UserExpense[]> {
    const q = query || {};
    q.startDate = time.date(startDate);
    q.endDate = time.date(endDate);
    return get<UserExpense[]>('/api/expense/search', q).then(l => l.map(mapExpense));
}

function toInt(n: number | string) {
    return typeof n === 'number' ? n : parseInt(n, 10); 
}

export function getExpense(id: number | string): Promise<Expense> {
    return get<Expense>(`/api/expense/${toInt(id)}`).then(mapExpense);
}

export function storeExpense(expense: Expense): Promise<ApiMessage> {
    return put<ApiMessage>('/api/expense', expense);
}

export function updateExpense(id: number | string, expense: Expense): Promise<ApiMessage> {
    return post<ApiMessage>(`/api/expense/${toInt(id)}`, expense);
}

export function deleteExpense(id: number | string): Promise<ApiMessage> {
    return del<ApiMessage>(`/api/expense/${toInt(id)}`);
}

export function createRecurring(id: number | string, period: RecurringExpensePeriod): Promise<ApiMessage> {
    return put<ApiMessage>(`/api/expense/recurring/${toInt(id)}`, { period });
}

export function queryReceivers(receiver: string): Promise<string[]> {
    return get<string[]>('/api/expense/receivers', { receiver: receiver });
}

export function getCategoryList(): Promise<Category[]> {
    return get<Category[]>('/api/category/list');
}

export function storeCategory(category: CategoryData): Promise<ApiMessage> {
    return put<ApiMessage>('/api/category', category);
}

export function getCategoryTotals(startDate: Date, endDate: Date): Promise<CategoryAndTotals[]> {
    const q = { 
        startDate: time.date(startDate),
        endDate: time.date(endDate),
    };
    return get<CategoryAndTotals[]>('/api/category/totals', q);
}

export function updateCategory(id: number | string, category: CategoryData): Promise<Category> {
    return post(`/api/category/${toInt(id)}`, category);
}
