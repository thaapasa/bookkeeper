import debug from 'debug';
import { ExpenseQuery, UserExpense } from 'shared/types/Expense';
import { IBaseProtocol } from 'pg-promise';
import basic from './BasicExpenses';
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
      inputCategoryIds.length > 0
        ? (
            await tx.manyOrNone<{ id: number }>(
              `SELECT id FROM categories
                WHERE id IN ($/ids:csv/) OR parent_id IN ($/ids:csv/)`,
              { ids: inputCategoryIds }
            )
          ).map(({ id }) => id)
        : [];
    const expenses = await tx.manyOrNone<UserExpense>(
      basic.expenseSelect(`
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
    return expenses.map(basic.mapExpense);
  };
}

export default {
  search: searchExpenses(db),
  tx: {
    search: searchExpenses,
  },
};
