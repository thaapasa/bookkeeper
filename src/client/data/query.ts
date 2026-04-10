import { QueryClient } from '@tanstack/react-query';

import { needUpdateE } from 'client/data/State';

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

// Temporary bridge: needUpdateE → query invalidation
// Ensures migrated components refetch when legacy mutations fire needUpdateE.
// Remove in Phase 3 when all mutations use useMutation.
needUpdateE.onValue(() => {
  queryClient.invalidateQueries({ queryKey: QueryKeys.expenses.all });
  queryClient.invalidateQueries({ queryKey: QueryKeys.categories.all });
  queryClient.invalidateQueries({ queryKey: QueryKeys.subscriptions.all });
  queryClient.invalidateQueries({ queryKey: QueryKeys.groupings.all });
  queryClient.invalidateQueries({ queryKey: QueryKeys.search.all });
});
