import debug from 'debug';
import { IBaseProtocol } from 'pg-promise';

import { ApiMessage } from 'shared/types/Api';
import { Error } from 'shared/types/Errors';
import { Expense } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import Money from 'shared/util/Money';

import basic from './BasicExpenses';
import { db } from './Db';
import { toBaseExpense } from './ExpenseUtils';

const log = debug('bookkeeper:api:expenses');

function splitExpense(
  groupId: number,
  userId: number,
  expenseId: number,
  splits: ExpenseSplit[]
) {
  return db.tx(async (tx): Promise<ApiMessage> => {
    const expense = toBaseExpense(
      await basic.tx.getById(tx)(groupId, userId, expenseId)
    );
    await checkSplits(splits, expense);
    log(`Splitting`, expense, 'to', splits);
    await Promise.all(splits.map(s => createSplit(tx, expense, s)));
    await basic.tx.deleteById(tx)(groupId, expenseId);
    return {
      status: 'OK',
      message: `Splitted expense ${expenseId} into ${splits.length} parts`,
    };
  });
}

async function createSplit(
  tx: IBaseProtocol<any>,
  expense: Expense,
  split: ExpenseSplit
) {
  const splitted = { ...expense, ...split };
  log(`Creating new expense`, splitted);
  await basic.tx.create(tx)(
    expense.userId,
    expense.groupId,
    splitted,
    expense.groupId
  );
}

async function checkSplits(splits: ExpenseSplit[], expense: Expense) {
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
