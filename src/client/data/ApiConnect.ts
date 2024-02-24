import {
  ExpenseCollection,
  ExpenseData,
  ExpenseQuery,
  ExpenseShortcut,
  ExpenseShortcutPayload,
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
import { FetchClient, RequestMethod, RequestSpec, uri } from 'shared/net';
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
  ExpenseGrouping,
  ExpenseGroupingData,
  ExpenseGroupingWithExpenses,
  ObjectId,
  Session,
  Source,
  SourcePatch,
  StatisticsSearchType,
  TrackingSubject,
  TrackingSubjectData,
  TrackingSubjectWithData,
} from 'shared/types';
import { PasswordUpdate, UserDataUpdate } from 'shared/userData';
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

interface ApiRequestSpec extends RequestSpec {
  allowRefreshAndRetry?: boolean;
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
    return this.authHeaderForToken(this.currentToken);
  }

  private async req<T>(path: string, method: RequestMethod, spec: ApiRequestSpec = {}): Promise<T> {
    try {
      return await client.req(path, method, {
        ...spec,
        headers: { ...this.authHeader(), ...spec.headers },
      });
    } catch (e) {
      if (e && e instanceof AuthenticationError && spec.allowRefreshAndRetry) {
        logger.warn(e, 'Authentication error from API, trying to refresh session');
        if (await checkLoginState()) {
          logger.info('Session refreshed, retrying request');
          await timeoutImmediate();
          return this.req<T>(path, method, { ...spec, allowRefreshAndRetry: false });
        }
      }
      throw e;
    }
  }

  protected authHeaderForToken = (token: string) => ({ Authorization: `Bearer ${token || ''}` });

  private get = <T>(path: string, spec?: ApiRequestSpec) => this.req<T>(path, 'GET', spec);
  private put = <T>(path: string, spec?: ApiRequestSpec) => this.req<T>(path, 'PUT', spec);
  private post = <T>(path: string, spec?: ApiRequestSpec) => this.req<T>(path, 'POST', spec);
  private patch = <T>(path: string, spec?: ApiRequestSpec) => this.req<T>(path, 'PATCH', spec);
  private delete = <T>(path: string, spec?: ApiRequestSpec) => this.req<T>(path, 'DELETE', spec);

  private uploadImage<T>(
    path: string,
    filename: string,
    file: File,
    spec?: Omit<RequestSpec, 'body'>,
  ): Promise<T> {
    const form = new FormData();
    form.append(filename, file);
    return this.req(path, 'POST', { ...spec, body: form });
  }

  public login(username: string, password: string): Promise<Session> {
    return client.post<Session>('/api/session', { body: { username, password } });
  }

  public logout(): Promise<ApiMessage> {
    return this.delete<ApiMessage>('/api/session');
  }

  public getSession(): Promise<Session> {
    return this.get<Session>('/api/session', { allowRefreshAndRetry: false });
  }

  public refreshSession(token: string): Promise<Session> {
    return this.put<Session>('/api/session/refresh', {
      allowRefreshAndRetry: false,
      headers: this.authHeaderForToken(token),
    });
  }

  public getApiStatus(): Promise<ApiStatus> {
    return this.get<ApiStatus>('/api/status');
  }

  public async getExpensesForMonth(year: number, month: number): Promise<ExpenseCollection> {
    const collection = await this.get<ExpenseCollection>('/api/expense/month', {
      query: {
        year: year.toString(),
        month: month.toString(),
      },
    });
    return mapExpenseObject(collection);
  }

  public async searchExpenses(query: ExpenseQuery): Promise<UserExpense[]> {
    const body: ExpenseQuery = filterDefinedProps(query);
    const expenses = await this.post<UserExpense[]>('/api/expense/search', { body });
    return expenses.map(mapExpense);
  }

  public async getExpense(id: number | string): Promise<UserExpenseWithDetails> {
    return mapExpense(await this.get<UserExpenseWithDetails>(uri`/api/expense/${id}`));
  }

  public async searchSubscriptions(
    criteria: SubscriptionSearchCriteria,
  ): Promise<SubscriptionResult> {
    return this.post(uri`/api/subscription/search`, { body: criteria });
  }

  public getSubscription = async (id: ObjectId): Promise<RecurringExpenseDetails | undefined> =>
    this.get(uri`/api/subscription/${id}`);

  public updateSubscriptionTemplate = async (
    id: ObjectId,
    expense: ExpenseData,
  ): Promise<ApiMessage> =>
    this.put<ApiMessage>(uri`/api/subscription/template/${id}`, { body: expense });

  public deleteSubscription = async (id: ObjectId): Promise<RecurringExpenseDetails | undefined> =>
    this.delete(uri`/api/subscription/${id}`);

  public storeExpense(expense: ExpenseData): Promise<ApiMessage> {
    return this.post<ApiMessage>('/api/expense', { body: expense });
  }

  public splitExpense(id: number | string, splits: ExpenseSplit[]): Promise<ApiMessage> {
    return this.post<ApiMessage>(uri`/api/expense/${id}/split`, {
      body: { splits: splits.map(s => ({ ...s, sum: Money.from(s.sum).toString() })) },
    });
  }

  public updateExpense(id: number | string, expense: ExpenseData): Promise<ApiMessage> {
    return this.put<ApiMessage>(uri`/api/expense/${id}`, { body: expense });
  }

  public deleteExpense(id: number | string): Promise<ApiMessage> {
    return this.delete<ApiMessage>(uri`/api/expense/${id}`);
  }

  public createRecurring(id: number | string, period: RecurrencePeriod): Promise<ApiMessage> {
    return this.post<ApiMessage>(uri`/api/expense/recurring/${id}`, {
      body: { period },
    });
  }

  public updateRecurringExpense(
    id: number | string,
    expense: ExpenseData,
    target: RecurringExpenseTarget,
  ): Promise<ApiMessage> {
    return this.put<ApiMessage>(uri`/api/expense/recurring/${id}`, {
      body: expense,
      query: { target },
    });
  }

  public deleteRecurringById(
    id: number | string,
    target: RecurringExpenseTarget,
  ): Promise<ApiMessage> {
    return this.delete<ApiMessage>(uri`/api/expense/recurring/${id}`, { query: { target } });
  }

  public queryReceivers(receiver: string): Promise<string[]> {
    return this.get<string[]>('/api/receiver/query', { query: { receiver } });
  }

  public renameReceiver(oldName: string, newName: string): Promise<ApiMessage> {
    return this.put<ApiMessage>('/api/receiver/rename', { body: { oldName, newName } });
  }

  public getCategoryList(): Promise<Category[]> {
    return this.get<Category[]>('/api/category/list');
  }

  public storeCategory(category: CategoryData): Promise<ApiMessage> {
    return this.post<ApiMessage>('/api/category', { body: category });
  }

  public getCategoryTotals = (startDate: Date, endDate: Date): Promise<CategoryAndTotals[]> =>
    this.get<CategoryAndTotals[]>('/api/category/totals', {
      query: {
        startDate: toISODate(startDate),
        endDate: toISODate(endDate),
      },
    });

  public updateCategory = (id: number | string, category: CategoryData): Promise<Category> =>
    this.put(uri`/api/category/${id}`, { body: category });

  public loadStatistics = (
    categoryIds: CategorySelection[],
    startDateInclusive: ISODate,
    endDateInclusive: ISODate,
    onlyOwn: boolean,
  ): Promise<CategoryStatistics> => {
    const body: StatisticsSearchType = {
      categoryIds,
      range: { startDate: startDateInclusive, endDate: endDateInclusive },
      onlyOwn,
    };
    return this.post(uri`/api/statistics/category`, { body });
  };

  public patchSource = (sourceId: ObjectId, data: SourcePatch) =>
    this.patch<Source>(uri`/api/source/${sourceId}`, { body: data });

  // Shortcuts

  public createShortcut = (data: ExpenseShortcutPayload): Promise<void> =>
    this.post(uri`/api/profile/shortcut`, { body: data });

  public getShortcut = (shortcutId: ObjectId): Promise<ExpenseShortcut> =>
    this.get(uri`/api/profile/shortcut/${shortcutId}`);

  public updateShortcut = (shortcutId: ObjectId, data: ExpenseShortcutPayload): Promise<void> =>
    this.put(uri`/api/profile/shortcut/${shortcutId}`, { body: data });

  public deleteShortcut = (shortcutId: ObjectId): Promise<void> =>
    this.delete(uri`/api/profile/shortcut/${shortcutId}`);

  public uploadShortcutIcon = (
    shortcutId: ObjectId,
    file: File,
    filename: string,
    margin: number,
  ): Promise<ExpenseShortcut> => {
    return this.uploadImage<ExpenseShortcut>(
      uri`/api/profile/shortcut/${shortcutId}/icon`,
      filename,
      file,
      { query: { margin } },
    );
  };

  public removeShortcutIcon = (shortcutId: ObjectId): Promise<void> =>
    this.delete(uri`/api/profile/shortcut/${shortcutId}/icon`);

  public shortShortcutUp = (shortcutId: ObjectId): Promise<void> =>
    this.post(uri`/api/profile/shortcut/${shortcutId}/sort/up`);

  public shortShortcutDown = (shortcutId: ObjectId): Promise<void> =>
    this.post(uri`/api/profile/shortcut/${shortcutId}/sort/down`);

  // Tracking subjects

  public getTrackingSubjects = (): Promise<TrackingSubjectWithData[]> =>
    this.get(uri`/api/tracking/list`);

  public getTrackingSubject = (trackingId: ObjectId): Promise<TrackingSubject> =>
    this.get(uri`/api/tracking/${trackingId}`);

  public createTrackingSubject = (payload: TrackingSubjectData): Promise<TrackingSubject> =>
    this.post(uri`/api/tracking`, { body: payload });

  public updateTrackingSubject = (
    subjectId: ObjectId,
    payload: TrackingSubjectData,
  ): Promise<TrackingSubject> => this.put(uri`/api/tracking/${subjectId}`, { body: payload });

  public changeTrackingColors = (subjectId: ObjectId): Promise<void> =>
    this.post(uri`/api/tracking/${subjectId}/color`);

  public deleteTrackingSubject = (subjectId: ObjectId): Promise<void> =>
    this.delete(uri`/api/tracking/${subjectId}`);

  public uploadTrackingImage = (
    subjectId: ObjectId,
    file: File,
    filename: string,
  ): Promise<void> => {
    return this.uploadImage(uri`/api/tracking/${subjectId}/image`, filename, file);
  };

  public deleteTrackingImage = (subjectId: ObjectId): Promise<void> =>
    this.delete(uri`/api/tracking/${subjectId}/image`);

  // Expense groupings

  public getExpenseGroupings = (): Promise<ExpenseGrouping[]> => this.get(uri`/api/grouping/list`);

  public getExpenseGrouping = (groupingId: ObjectId): Promise<ExpenseGrouping> =>
    this.get(uri`/api/grouping/${groupingId}`);

  public getExpenseGroupingWithExpenses = (
    groupingId: ObjectId,
  ): Promise<ExpenseGroupingWithExpenses> => this.get(uri`/api/grouping/${groupingId}/expenses`);

  public createExpenseGrouping = (payload: ExpenseGroupingData): Promise<ExpenseGrouping> =>
    this.post(uri`/api/grouping`, { body: payload });

  public updateExpenseGrouping = (
    groupingId: ObjectId,
    payload: ExpenseGroupingData,
  ): Promise<ExpenseGrouping> => this.put(uri`/api/grouping/${groupingId}`, { body: payload });

  public deleteExpenseGrouping = (groupingId: ObjectId): Promise<void> =>
    this.delete(uri`/api/grouping/${groupingId}`);

  public uploadGroupingImage = (
    groupingId: ObjectId,
    file: File,
    filename: string,
  ): Promise<void> => {
    return this.uploadImage(uri`/api/grouping/${groupingId}/image`, filename, file);
  };

  public deleteGroupingImage = (groupingId: ObjectId): Promise<void> =>
    this.delete(uri`/api/grouping/${groupingId}/image`);

  // User data

  public updateUserData = (userData: UserDataUpdate): Promise<void> =>
    this.put(uri`/api/profile/userData`, { body: userData });

  public changeUserPassword = (update: PasswordUpdate): Promise<void> =>
    this.put(uri`/api/profile/password`, { body: update });

  public uploadProfileImage = (file: File, filename: string): Promise<void> => {
    return this.uploadImage(uri`/api/profile/image`, filename, file);
  };

  public deleteProfileImage = (): Promise<void> => this.delete(uri`/api/profile/image`);

  // Reports

  public createReport = (title: string, query: ExpenseQuery) => {
    const body: ReportCreationData = {
      title,
      query: filterDefinedProps(query),
    };
    return this.post<ReportDef>(uri`/api/report`, body);
  };

  public deleteReport = (reportId: ObjectId) =>
    this.delete<ApiMessage>(uri`/api/report/${reportId}`);

  public getDbStatus = () => this.get<DbStatus>('/api/admin/status');
}

const apiConnect = new ApiConnect();
export default apiConnect;
