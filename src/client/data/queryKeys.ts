import { ExpenseQuery, SubscriptionMatchesQuery, SubscriptionSearchCriteria } from 'shared/expense';
import { ISODate, ISOMonth } from 'shared/time';
import { CategorySelection, ObjectId } from 'shared/types';

export const QueryKeys = {
  expenses: {
    month: (month: ISOMonth) => ['expenses', 'month', month] as const,
  },
  categories: {
    all: ['categories'] as const,
    totals: (start: ISODate, end: ISODate) => ['categories', 'totals', { start, end }] as const,
  },
  subscriptions: {
    search: (criteria: SubscriptionSearchCriteria) =>
      ['subscriptions', 'search', criteria] as const,
    matches: (query: SubscriptionMatchesQuery) => ['subscriptions', 'matches', query] as const,
    preview: (filter: ExpenseQuery) => ['subscriptions', 'preview', filter] as const,
  },
  tracking: {
    all: ['tracking'] as const,
    list: ['tracking', 'list'] as const,
    detail: (id: ObjectId) => ['tracking', 'detail', id] as const,
  },
  groupings: {
    all: ['groupings'] as const,
    list: ['groupings', 'list'] as const,
    detail: (id: ObjectId) => ['groupings', 'detail', id] as const,
    expenses: (id: ObjectId) => ['groupings', 'expenses', id] as const,
    tags: ['groupings', 'tags'] as const,
  },
  shortcuts: {
    detail: (id: ObjectId) => ['shortcuts', 'detail', id] as const,
  },
  search: {
    results: (query: ExpenseQuery) => ['search', query] as const,
  },
  statistics: {
    category: (params: {
      categoryIds: CategorySelection[];
      startDate: ISODate;
      endDate: ISODate;
      onlyOwn: boolean;
    }) => ['statistics', 'category', params] as const,
    yearlySummary: ['statistics', 'yearly-summary'] as const,
  },
  statements: {
    all: ['statements'] as const,
    rows: (sourceId: ObjectId, startDate?: ISODate, endDate?: ISODate) =>
      ['statements', 'rows', { sourceId, startDate, endDate }] as const,
  },
  db: {
    status: ['db', 'status'] as const,
  },
  currencies: {
    rates: ['currencies', 'rates'] as const,
  },
} as const;
