import { ExpenseQuery, SubscriptionMatchesQuery, SubscriptionSearchCriteria } from 'shared/expense';
import { ISODate, ISOMonth } from 'shared/time';
import { CategorySelection, ObjectId } from 'shared/types';

export const QueryKeys = {
  expenses: {
    all: ['expenses'] as const,
    month: (month: ISOMonth) => ['expenses', 'month', month] as const,
    detail: (id: ObjectId) => ['expenses', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    totals: (start: ISODate, end: ISODate) => ['categories', 'totals', { start, end }] as const,
  },
  subscriptions: {
    all: ['subscriptions'] as const,
    search: (criteria: SubscriptionSearchCriteria) =>
      ['subscriptions', 'search', criteria] as const,
    matches: (query: SubscriptionMatchesQuery) => ['subscriptions', 'matches', query] as const,
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
    all: ['shortcuts'] as const,
    detail: (id: ObjectId) => ['shortcuts', 'detail', id] as const,
  },
  search: {
    all: ['search'] as const,
    results: (query: ExpenseQuery) => ['search', query] as const,
  },
  statistics: {
    all: ['statistics'] as const,
    category: (params: {
      categoryIds: CategorySelection[];
      startDate: ISODate;
      endDate: ISODate;
      onlyOwn: boolean;
    }) => ['statistics', 'category', params] as const,
  },
  sources: {
    all: ['sources'] as const,
  },
  profile: {
    all: ['profile'] as const,
  },
  session: {
    all: ['session'] as const,
  },
  db: {
    status: ['db', 'status'] as const,
  },
  api: {
    status: ['api', 'status'] as const,
  },
  receivers: {
    all: ['receivers'] as const,
    query: (search: string) => ['receivers', { query: search }] as const,
  },
} as const;
