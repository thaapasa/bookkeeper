import {
  ExpenseCollection,
  ExpenseData,
  ExpenseQuery,
  ExpenseSplit,
  ExpenseStatus,
  RecurrencePeriod,
  RecurringExpenseDetails,
  RecurringExpenseTarget,
  ReportCreationData,
  ReportDef,
  SubscriptionResult,
  SubscriptionSearchCriteria,
  UserExpense,
  UserExpenseWithDetails,
} from 'shared/expense';
import { FetchClient, uri } from 'shared/net';
import { ISODate, timeoutImmediate, toISODate } from 'shared/time';
import {
  ApiMessage,
  ApiStatus,
  AuthenticationError,
  Category,
  CategoryAndTotals,
  CategoryData,
  CategorySelection,
  CategoryStatistics,
  DbStatus,
  ObjectId,
  Session,
  Source,
  SourcePatch,
  StatisticsSearchType,
} from 'shared/types';
import { filterDefinedProps, Money } from 'shared/util';
import { logger } from 'client/Logger';

import { checkLoginState } from './Login';

const client = new FetchClient(fetch.bind(window), '', logger);

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
    allowRefreshAndRetry = true,
  ): Promise<T> {
    try {
      return await client.req(path, {
        ...details,
        headers: { ...details.headers, ...this.authHeader() },
      });
    } catch (e) {
      if (e && e instanceof AuthenticationError && allowRefreshAndRetry) {
        logger.warn(e, 'Authentication error from API, trying to refresh session');
        if (await checkLoginState()) {
          logger.info('Session refreshed, retrying request');
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
    allowRefreshAndRetry?: boolean,
  ): Promise<T> {
    return this.req<T>(path, { method: 'GET', query }, allowRefreshAndRetry);
  }

  private put<T>(
    path: string,
    body?: any,
    query?: Record<string, string>,
    allowRefreshAndRetry?: boolean,
  ): Promise<T> {
    return this.req<T>(
      path,
      {
        method: 'PUT',
        body,
        query,
        headers: { ...FetchClient.contentTypeJson },
      },
      allowRefreshAndRetry,
    );
  }

  private post<T>(path: string, body?: any, query?: Record<string, string>): Promise<T> {
    return this.req<T>(path, {
      method: 'POST',
      body,
      query,
      headers: { ...FetchClient.contentTypeJson },
    });
  }

  private patch<T>(path: string, body?: any, query?: Record<string, string>): Promise<T> {
    return this.req<T>(path, {
      method: 'PATCH',
      body,
      query,
      headers: { ...FetchClient.contentTypeJson },
    });
  }

  private del<T>(path: string, body?: any, query?: Record<string, string>): Promise<T> {
    return this.req<T>(path, { method: 'DELETE', body, query });
  }

  public login(username: string, password: string): Promise<Session> {
    return client.post<Session>('/api/session', { username, password });
  }

  public logout(): Promise<ApiMessage> {
    return this.del<ApiMessage>('/api/session');
  }

  public getSession(): Promise<Session> {
    return this.get<Session>('/api/session', undefined, false);
  }

  public refreshSession(): Promise<Session> {
    return this.put<Session>('/api/session/refresh', undefined, undefined, false);
  }

  public getApiStatus(): Promise<ApiStatus> {
    return this.get<ApiStatus>('/api/status');
  }

  public async getExpensesForMonth(year: number, month: number): Promise<ExpenseCollection> {
    const collection = await this.get<ExpenseCollection>('/api/expense/month', {
      year: year.toString(),
      month: month.toString(),
    });
    return mapExpenseObject(collection);
  }

  public async searchExpenses(query: ExpenseQuery): Promise<UserExpense[]> {
    const body: ExpenseQuery = filterDefinedProps(query);
    const expenses = await this.post<UserExpense[]>('/api/expense/search', body);
    return expenses.map(mapExpense);
  }

  public async getExpense(id: number | string): Promise<UserExpenseWithDetails> {
    return mapExpense(await this.get<UserExpenseWithDetails>(uri`/api/expense/${id}`));
  }

  public async searchSubscriptions(
    criteria: SubscriptionSearchCriteria,
  ): Promise<SubscriptionResult> {
    return this.post(uri`/api/subscription/search`, criteria);
  }

  public getSubscription = async (id: ObjectId): Promise<RecurringExpenseDetails | undefined> =>
    this.get(uri`/api/subscription/${id}`);

  public updateSubscriptionTemplate = async (
    id: ObjectId,
    expense: ExpenseData,
  ): Promise<ApiMessage> => this.put<ApiMessage>(uri`/api/subscription/template/${id}`, expense);

  public deleteSubscription = async (id: ObjectId): Promise<RecurringExpenseDetails | undefined> =>
    this.del(uri`/api/subscription/${id}`);

  public storeExpense(expense: ExpenseData): Promise<ApiMessage> {
    return this.post<ApiMessage>('/api/expense', expense);
  }

  public splitExpense(id: number | string, splits: ExpenseSplit[]): Promise<ApiMessage> {
    return this.post<ApiMessage>(uri`/api/expense/${id}/split`, {
      splits: splits.map(s => ({ ...s, sum: Money.from(s.sum).toString() })),
    });
  }

  public updateExpense(id: number | string, expense: ExpenseData): Promise<ApiMessage> {
    return this.put<ApiMessage>(uri`/api/expense/${id}`, expense);
  }

  public deleteExpense(id: number | string): Promise<ApiMessage> {
    return this.del<ApiMessage>(uri`/api/expense/${id}`);
  }

  public createRecurring(id: number | string, period: RecurrencePeriod): Promise<ApiMessage> {
    return this.post<ApiMessage>(uri`/api/expense/recurring/${id}`, {
      period,
    });
  }

  public updateRecurringExpense(
    id: number | string,
    expense: ExpenseData,
    target: RecurringExpenseTarget,
  ): Promise<ApiMessage> {
    return this.put<ApiMessage>(uri`/api/expense/recurring/${id}?target=${target}`, expense);
  }

  public deleteRecurringById(
    id: number | string,
    target: RecurringExpenseTarget,
  ): Promise<ApiMessage> {
    return this.del<ApiMessage>(uri`/api/expense/recurring/${id}?target=${target}`);
  }

  public queryReceivers(receiver: string): Promise<string[]> {
    return this.get<string[]>('/api/receiver/query', { receiver });
  }

  public renameReceiver(oldName: string, newName: string): Promise<ApiMessage> {
    return this.put<ApiMessage>('/api/receiver/rename', { oldName, newName });
  }

  public getCategoryList(): Promise<Category[]> {
    return this.get<Category[]>('/api/category/list');
  }

  public storeCategory(category: CategoryData): Promise<ApiMessage> {
    return this.post<ApiMessage>('/api/category', category);
  }

  public getCategoryTotals = (startDate: Date, endDate: Date): Promise<CategoryAndTotals[]> =>
    this.get<CategoryAndTotals[]>('/api/category/totals', {
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
    });

  public updateCategory = (id: number | string, category: CategoryData): Promise<Category> =>
    this.put(uri`/api/category/${id}`, category);

  public loadStatistics = (
    categoryIds: CategorySelection[],
    startDate: ISODate,
    endDate: ISODate,
    onlyOwn: boolean,
  ): Promise<CategoryStatistics> => {
    const body: StatisticsSearchType = {
      categoryIds,
      range: { startDate, endDate },
      onlyOwn,
    };
    return this.post(uri`/api/statistics/category`, body);
  };

  public patchSource = (sourceId: ObjectId, data: SourcePatch) =>
    this.patch<Source>(uri`/api/source/${sourceId}`, data);

  public createReport = (title: string, query: ExpenseQuery) => {
    const body: ReportCreationData = {
      title,
      query: filterDefinedProps(query),
    };
    return this.post<ReportDef>(uri`/api/report`, body);
  };

  public deleteReport = (reportId: ObjectId) => this.del<ApiMessage>(uri`/api/report/${reportId}`);

  public getDbStatus = () => this.get<DbStatus>('/api/admin/status');
}

const apiConnect = new ApiConnect();
export default apiConnect;
