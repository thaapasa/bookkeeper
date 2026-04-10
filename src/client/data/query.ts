import { QueryClient } from '@tanstack/react-query';

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

/** Invalidate all expense-related queries (expenses, categories, search). */
export function invalidateExpenseData() {
  queryClient.invalidateQueries({ queryKey: QueryKeys.expenses.all });
  queryClient.invalidateQueries({ queryKey: QueryKeys.categories.all });
  queryClient.invalidateQueries({ queryKey: QueryKeys.search.all });
}

/** Invalidate subscription queries and related expense data. */
export function invalidateSubscriptionData() {
  queryClient.invalidateQueries({ queryKey: QueryKeys.subscriptions.all });
  queryClient.invalidateQueries({ queryKey: QueryKeys.expenses.all });
}
