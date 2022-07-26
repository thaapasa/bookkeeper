import debug from 'debug';

import { ApiMessage } from 'shared/types/Api';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';

import basic from './BasicExpenses';
import { db } from './Db';

const log = debug('bookkeeper:api:expenses');

function splitExpense(
  groupId: number,
  userId: number,
  expenseId: number,
  splits: ExpenseSplit[]
) {
  return db.tx(async (tx): Promise<ApiMessage> => {
    const e = await basic.tx.getById(tx)(groupId, userId, expenseId);
    log(`Splitting`, e, 'to', splits);
    return { status: 'OK', message: `Yeah ${splits.length}` };
  });
}

export default {
  split: splitExpense,
};
