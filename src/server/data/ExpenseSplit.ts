import debug from 'debug';

import { ApiMessage } from 'shared/types/Api';
import { Error } from 'shared/types/Errors';
import { UserExpense } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import Money from 'shared/util/Money';

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
    await checkSplits(splits, e);
    log(`Splitting`, e, 'to', splits);
    return { status: 'OK', message: `Yeah ${splits.length}` };
  });
}

async function checkSplits(splits: ExpenseSplit[], expense: UserExpense) {
  if (splits.length < 2) {
    throw new Error(
      'INVALID_SPLIT',
      'Expense splitting requires at least two splits',
      400,
      splits
    );
  }

  const partSum = splits.reduce((acc, s) => acc.plus(s.sum), Money.from(0));
  if (!partSum.equals(expense.sum)) {
    throw new Error(
      'INVALID_SPLIT',
      `Split sums (${partSum.toString()}) do not match expense sum (${
        expense.sum
      })`,
      400,
      splits
    );
  }
}

export default {
  split: splitExpense,
};
