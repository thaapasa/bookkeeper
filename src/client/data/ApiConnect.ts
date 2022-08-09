import debug from 'debug';

import { ApiMessage, ApiStatus } from 'shared/types/Api';
import { AuthenticationError } from 'shared/types/Errors';
import {
  ExpenseCollection,
  ExpenseData,
  ExpenseQuery,
  ExpenseStatus,
  RecurringExpensePeriod,
  RecurringExpenseTarget,
  UserExpense,
  UserExpenseWithDetails,
} from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import {
  Category,
  CategoryAndTotals,
  CategoryData,
  Session,
} from 'shared/types/Session';
import { FetchClient } from 'shared/util/FetchClient';
import Money from 'shared/util/Money';
import { filterTruthyProps } from 'shared/util/Objects';
import { timeoutImmediate, toISODate } from 'shared/util/Time';
import { uri } from 'shared/util/UrlUtils';

import { checkLoginState } from './Login';

const log = debug('net:api-connect');

const client = new FetchClient(fetch.bind(window));

function mapExpense<T extends UserExpense | UserExpenseWithDetails>(e: T): T {
  e.userBenefit = Money.from(e.userBenefit, 0);
  e.userCost = Money.from(e.userCost, 0);
  e.userBalance = Money.from(e.userBalance, 0);
  e.userIncome = Money.from(e.userIncome, 0);
  e.userSplit = Money.from(e.userSplit, 0);
  e.userTransferor = Money.from(e.userTransferor, 0);
  e.userTransferee = Money.from(e.userTransferee, 0);
  return e;
}

function mapStatus(s: ExpenseStatus): ExpenseStatus {
  return {
    cost: Money.from(s.cost),
    benefit: Money.from(s.benefit),
    income: Money.from(s.income),
    split: Money.from(s.split),
    transferor: Money.from(s.transferor),
    transferee: Money.from(s.transferee),
    value: Money.from(s.value),
    balance: Money.from(s.balance),
  };
}

function mapExpenseObject(e: ExpenseCollection): ExpenseCollection {
  e.expenses = e.expenses.map(mapExpense);
  e.startStatus = mapStatus(e.startStatus);
  e.endStatus = mapStatus(e.endStatus);
  e.monthStatus = mapStatus(e.monthStatus);
  return e;
}

export class ApiConnect {
  private currentToken: string | null = null;

  public setToken(token: string | null) {
    this.currentToken = token;
  }

  private authHeader(): Record<string, string> {
    if (!this.currentToken) {
      return {};
    }
    return { Authorization: `Bearer ${this.currentToken || ''}` };
  }

  private async req<T>(
    path: string,
    details: {
      method: string;
      query?: Record<string, any>;
      headers?: Record<string, string>;
      body?: any;
    },
    allowRefreshAndRetry = true
  ): Promise<T> {
    try {
      return await client.req(path, {
        ...details,
        headers: { ...details.headers, ...this.authHeader() },
      });
    } catch (e) {
      if (e && e instanceof AuthenticationError && allowRefreshAndRetry) {
        log('Authentication error from API, trying to refresh session');
        if (await checkLoginState()) {
          log(`Session refreshed, retrying request`);
          await timeoutImmediate();
          return this.req<T>(path, details, false);
        }
      }
      throw e;
    }
  }

  private get<T>(
    path: string,
    query?: Record<string, any>,
    allowRefreshAndRetry?: boolean
  ): Promise<T> {
    return this.req<T>(path, { method: 'GET', query }, allowRefreshAndRetry);
  }

  private put<T>(
    path: string,
    body?: any,
    query?: Record<string, string>,
    allowRefreshAndRetry?: boolean
  ): Promise<T> {
    return this.req<T>(
      path,
      {
        method: 'PUT',
        body,
        query,
        headers: { ...FetchClient.contentTypeJson },
      },
      allowRefreshAndRetry
    );
  }

  private post<T>(
    path: string,
    body?: any,
    query?: Record<string, string>
  ): Promise<T> {
    return this.req<T>(path, {
      method: 'POST',
      body,
      query,
      headers: { ...FetchClient.contentTypeJson },
    });
  }

  private del<T>(
    path: string,
    body?: any,
    query?: Record<string, string>
  ): Promise<T> {
    return this.req<T>(path, { method: 'DELETE', body, query });
  }

  public login(username: string, password: string): Promise<Session> {
    return client.put<Session>('/api/session', { username, password });
  }

  public logout(): Promise<ApiMessage> {
    return this.del<ApiMessage>('/api/session');
  }

  public getSession(): Promise<Session> {
    return this.get<Session>('/api/session', undefined, false);
  }

  public refreshSession(): Promise<Session> {
    return this.put<Session>(
      '/api/session/refresh',
      undefined,
      undefined,
      false
    );
  }

  public getApiStatus(): Promise<ApiStatus> {
    return this.get<ApiStatus>('/api/status');
  }

  public async getExpensesForMonth(
    year: number,
    month: number
  ): Promise<ExpenseCollection> {
    const collection = await this.get<ExpenseCollection>('/api/expense/month', {
      year: year.toString(),
      month: month.toString(),
    });
    return mapExpenseObject(collection);
  }

  public async searchExpenses(query: ExpenseQuery): Promise<UserExpense[]> {
    return (
      await this.get<UserExpense[]>(
        `/api/expense/search`,
        ExpenseQuery.encode(filterTruthyProps(query))
      )
    ).map(mapExpense);
  }

  public async getExpense(
    id: number | string
  ): Promise<UserExpenseWithDetails> {
    return mapExpense(
      await this.get<UserExpenseWithDetails>(uri`/api/expense/${id}`)
    );
  }

  public storeExpense(expense: ExpenseData): Promise<ApiMessage> {
    return this.put<ApiMessage>('/api/expense', expense);
  }

  public splitExpense(
    id: number | string,
    splits: ExpenseSplit[]
  ): Promise<ApiMessage> {
    return this.post<ApiMessage>(uri`/api/expense/${id}/split`, {
      splits: splits.map(ExpenseSplit.encode),
    });
  }

  public updateExpense(
    id: number | string,
    expense: ExpenseData
  ): Promise<ApiMessage> {
    return this.post<ApiMessage>(uri`/api/expense/${id}`, expense);
  }

  public deleteExpense(id: number | string): Promise<ApiMessage> {
    return this.del<ApiMessage>(uri`/api/expense/${id}`);
  }

  public createRecurring(
    id: number | string,
    period: RecurringExpensePeriod
  ): Promise<ApiMessage> {
    return this.put<ApiMessage>(uri`/api/expense/recurring/${id}`, {
      period,
    });
  }

  public updateRecurringExpense(
    id: number | string,
    expense: ExpenseData,
    target: RecurringExpenseTarget
  ): Promise<ApiMessage> {
    return this.post<ApiMessage>(
      uri`/api/expense/recurring/${id}?target=${target}`,
      expense
    );
  }

  public deleteRecurringById(
    id: number | string,
    target: RecurringExpenseTarget
  ): Promise<ApiMessage> {
    return this.del<ApiMessage>(
      uri`/api/expense/recurring/${id}?target=${target}`
    );
  }

  public queryReceivers(receiver: string): Promise<string[]> {
    return this.get<string[]>('/api/expense/receivers', { receiver });
  }

  public getCategoryList(): Promise<Category[]> {
    return this.get<Category[]>('/api/category/list');
  }

  public storeCategory(category: CategoryData): Promise<ApiMessage> {
    return this.put<ApiMessage>('/api/category', category);
  }

  public getCategoryTotals = (
    startDate: Date,
    endDate: Date
  ): Promise<CategoryAndTotals[]> =>
    this.get<CategoryAndTotals[]>('/api/category/totals', {
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
    });

  public updateCategory = (
    id: number | string,
    category: CategoryData
  ): Promise<Category> => this.post(uri`/api/category/${id}`, category);

  public loadStatistics = (categoryIds: number[]): Promise<any> =>
    this.post(uri`/api/statistics/category`, { categoryIds });
}

const apiConnect = new ApiConnect();
export default apiConnect;
