import debug from 'debug';
import { ExpenseQuery, UserExpense } from '../../shared/types/Expense';
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
    const categoryIds =
      typeof query.categoryId === 'number'
        ? [query.categoryId]
        : query.categoryId || [];
    const expenses = await tx.manyOrNone<UserExpense>(
      basic.expenseSelect(`
      WHERE group_id=$/groupId/
      AND template=false
      AND ($/startDate/ IS NULL OR date::DATE >= $/startDate/::DATE)
      AND ($/endDate/ IS NULL OR date::DATE <= $/endDate/::DATE)
      ${
        categoryIds.length > 0
          ? `AND (category_id IN ($/categoryIds:csv/))`
          : ''
      }
      AND ($/receiver/ IS NULL OR receiver=$/receiver/)
      AND (
        $/search/ = ''
        OR title ILIKE '%$/search:value/%'
        OR receiver ILIKE '%$/search:value/%'
      )`),
      {
        userId,
        groupId,
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
