import debug from 'debug';
import { IBaseProtocol } from 'pg-promise';

import { ExpenseQuery, UserExpense } from 'shared/types/Expense';

import { BasicExpenseDb } from './BasicExpensesDb';
import { CategoriesDb } from './CategoriesDb';
import { db } from './Db';

const log = debug('bookkeeper:api:expenses:search');

function searchExpenses(tx: IBaseProtocol<any>) {
  return async (
    userId: number,
    groupId: number,
    query: ExpenseQuery
  ): Promise<UserExpense[]> => {
    log(`Searching for ${JSON.stringify(query)}`);
    const inputCategoryIds =
      typeof query.categoryId === 'number'
        ? [query.categoryId]
        : query.categoryId || [];
    const categoryIds =
      query.includeSubCategories && inputCategoryIds.length > 0
        ? await CategoriesDb.expandSubCategories(tx, groupId, inputCategoryIds)
        : inputCategoryIds;
    const expenses = await tx.manyOrNone<UserExpense>(
      BasicExpenseDb.expenseSelect(`
      WHERE group_id=$/groupId/
      AND template=false
      AND ($/startDate/ IS NULL OR date::DATE >= $/startDate/::DATE)
      AND ($/endDate/ IS NULL OR date::DATE <= $/endDate/::DATE)
      AND ($/expenseUserId/ IS NULL OR e.user_id = $/expenseUserId/)
      ${
        categoryIds.length > 0
          ? `AND (category_id IN ($/categoryIds:csv/))`
          : ''
      }
      ${query.receiver ? `AND (receiver ILIKE '%$/receiver:value/%')` : ''}
      AND (
        $/search/ = ''
        OR title ILIKE '%$/search:value/%'
        OR receiver ILIKE '%$/search:value/%'
      )`),
      {
        userId,
        groupId,
        expenseUserId: query.userId,
        startDate: query.startDate,
        endDate: query.endDate,
        categoryIds,
        receiver: query.receiver,
        search: query.search || '',
      }
    );
    return expenses.map(BasicExpenseDb.mapExpense);
  };
}

export default {
  search: searchExpenses(db),
  tx: {
    search: searchExpenses,
  },
};
