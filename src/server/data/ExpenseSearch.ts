import { ITask } from 'pg-promise';

import { ExpenseQuery, UserExpense } from 'shared/expense';
import { isDefined } from 'shared/types';
import { logger } from 'server/Logger';

import { dbRowToExpense, expenseSelectClause } from './BasicExpenseDb';
import { expandSubCategories } from './CategoryDb';

export async function getExpenseSearchQuery(
  tx: ITask<any>,
  userId: number,
  groupId: number,
  query: ExpenseQuery,
) {
  const type = Array.isArray(query.type)
    ? query.type
    : isDefined(query.type)
      ? [query.type]
      : undefined;
  const inputCategoryIds =
    typeof query.categoryId === 'number' ? [query.categoryId] : query.categoryId || [];
  const categoryIds =
    query.includeSubCategories && inputCategoryIds.length > 0
      ? await expandSubCategories(tx, groupId, inputCategoryIds)
      : inputCategoryIds;

  return {
    clause: expenseSelectClause(`--sql
      WHERE group_id=$/groupId/
      AND template=false
      AND ($/startDate/ IS NULL OR date::DATE >= $/startDate/::DATE)
      AND ($/endDate/ IS NULL OR date::DATE <= $/endDate/::DATE)
      AND ($/expenseUserId/ IS NULL OR e.user_id = $/expenseUserId/)
      ${query.includeRecurring === false ? 'AND e.recurring_expense_id IS NULL' : ''}
      ${type ? `AND e.type IN ($/type:csv/)` : ''}
      ${isDefined(query.confirmed) ? `AND confirmed = $/confirmed/` : ''}
      ${categoryIds.length > 0 ? `AND (category_id IN ($/categoryIds:csv/))` : ''}
      ${query.receiver ? `AND (receiver ILIKE '%$/receiver:value/%')` : ''}
      AND (
        $/search/ = ''
        OR title ILIKE '%$/search:value/%'
        OR receiver ILIKE '%$/search:value/%'
      )`),
    params: {
      userId,
      groupId,
      expenseUserId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
      categoryIds,
      receiver: query.receiver,
      search: query.search || '',
      confirmed: query.confirmed,
      type,
    },
  };
}

export async function searchExpenses(
  tx: ITask<any>,
  userId: number,
  groupId: number,
  query: ExpenseQuery,
): Promise<UserExpense[]> {
  logger.debug(`Searching for ${JSON.stringify(query)}`);
  const { clause, params } = await getExpenseSearchQuery(tx, userId, groupId, query);
  const expenses = await tx.manyOrNone<UserExpense>(clause, params);
  return expenses.map(dbRowToExpense);
}
