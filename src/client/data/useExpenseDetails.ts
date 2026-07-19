import { useSuspenseQuery } from '@tanstack/react-query';

import { UserExpenseWithDetails } from 'shared/expense';
import { ObjectId } from 'shared/types';

import { apiConnect } from './ApiConnect';
import { QueryKeys } from './queryKeys';

/**
 * Full details (division, description, matched statement rows) of one expense.
 * Suspends; wrap the consumer in a `QueryBoundary`.
 */
export function useExpenseDetails(expenseId: ObjectId): UserExpenseWithDetails {
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.expenses.detail(expenseId),
    queryFn: () => apiConnect.getExpense(expenseId),
  });
  return data;
}
