import Money from '../../shared/util/Money';
import { Session, Category, CategoryAndTotals, CategoryData } from '../../shared/types/Session';
import { Map } from '../../shared/util/Util';
import { FetchClient } from '../../shared/util/FetchClient';
import { ApiMessage } from '../../shared/types/Api';
import { ExpenseCollection, ExpenseStatus, Expense, UserExpense, RecurringExpensePeriod, UserExpenseWithDetails, ExpenseInEditor, ExpenseData } from '../../shared/types/Expense';
import { tokenP } from './Login';
import { formatDate, DateLike } from 'shared/util/Time';
const debug = require('debug')('bookkeeper:api-connect');
const client = new FetchClient(() => fetch);

let currentToken: string | null = null;
debug('tokenP', tokenP);
tokenP.onValue(t => {
  debug('ApiConnect working with token', t);
  currentToken = t;
});

function mapExpense<T extends UserExpense | UserExpenseWithDetails>(e: T): T {
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
  return { 'Authorization': `Bearer ${currentToken || ''}` };
}

function get<T>(path: string, query?: Map<string>): Promise<T> {
  return client.get<T>(path, query, authHeader());
}

function put<T>(path: string, body?: any, query?: Map<string>): Promise<T> {
  return client.put<T>(path, body, query, authHeader());
}

function post<T>(path: string, body?: any, query?: Map<string>): Promise<T> {
  return client.post<T>(path, body, query, authHeader());
}

function del<T>(path: string, data?: any, query?: Map<string>): Promise<T> {
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

export async function getExpensesForMonth(year: number, month: number): Promise<ExpenseCollection> {
  const collection = await get<ExpenseCollection>('/api/expense/month', { year: year.toString(), month: month.toString() })
  return mapExpenseObject(collection);
}

export function searchExpenses(startDate: DateLike, endDate: DateLike, query: Map<string | number>): Promise<UserExpense[]> {
  const q = { ...query, startDate: formatDate(startDate), endDate: formatDate(endDate) };
  return get<UserExpense[]>('/api/expense/search', q).then(l => l.map(mapExpense));
}

function toInt(n: number | string) {
  return typeof n === 'number' ? n : parseInt(n, 10);
}

export function getExpense(id: number | string): Promise<UserExpenseWithDetails> {
  return get<UserExpenseWithDetails>(`/api/expense/${toInt(id)}`).then(mapExpense);
}

export function storeExpense(expense: ExpenseData): Promise<ApiMessage> {
  return put<ApiMessage>('/api/expense', expense);
}

export function updateExpense(id: number | string, expense: ExpenseData): Promise<ApiMessage> {
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
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
  return get<CategoryAndTotals[]>('/api/category/totals', q);
}

export function updateCategory(id: number | string, category: CategoryData): Promise<Category> {
  return post(`/api/category/${toInt(id)}`, category);
}
