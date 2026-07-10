import { QueryClient } from '@tanstack/react-query';

import { ExpenseCollection, UserExpense } from 'shared/expense';
import { ISOMonth } from 'shared/time';

import { QueryKeys } from './queryKeys';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

/**
 * Invalidate all queries after a data mutation. Expense data feeds nearly every view
 * (months, search, groupings, tracking, statistics, subscriptions, receivers, category
 * totals), so a maintained list of "affected" keys would drift as domains are added.
 * With `staleTime: 0` only currently mounted queries actually refetch, so a blanket
 * invalidation is both correct and cheap.
 */
export function invalidateServerData() {
  queryClient.invalidateQueries();
}

/** Patch a single expense in the month cache without refetching. */
export function updateExpenseInMonthCache(
  month: ISOMonth,
  expenseId: number,
  updated: UserExpense,
) {
  queryClient.setQueryData<ExpenseCollection>(QueryKeys.expenses.month(month), old =>
    old ? { ...old, expenses: old.expenses.map(e => (e.id === expenseId ? updated : e)) } : old,
  );
}
