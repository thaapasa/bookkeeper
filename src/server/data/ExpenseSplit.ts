import { ITask } from 'pg-promise';

import { Expense, ExpenseSplit } from 'shared/expense';
import { BkError } from 'shared/types';
import { Money } from 'shared/util';
import { logger } from 'server/Logger';

import { deleteExpenseById, getExpenseById } from './BasicExpenseDb';
import { createExpense } from './BasicExpenseService';
import { toBaseExpense } from './ExpenseUtils';

export async function splitExpense(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  splits: ExpenseSplit[],
) {
  const expense = toBaseExpense(await getExpenseById(tx, groupId, userId, expenseId));
  await checkSplits(splits, expense);
  logger.debug({ expense, splits }, 'Splitting expense');
  await Promise.all(splits.map(s => createSplit(tx, expense, s)));
  await deleteExpenseById(tx, groupId, expenseId);
  return {
    status: 'OK',
    message: `Splitted expense ${expenseId} into ${splits.length} parts`,
  };
}

async function createSplit(tx: ITask<any>, expense: Expense, split: ExpenseSplit) {
  const splitted = { ...expense, ...split };
  logger.debug(splitted, `Creating new expense`);
  await createExpense(tx, expense.userId, expense.groupId, splitted, expense.groupId);
}

async function checkSplits(splits: ExpenseSplit[], expense: Expense) {
  if (splits.length < 2) {
    throw new BkError(
      'INVALID_SPLIT',
      'Expense splitting requires at least two splits',
      400,
      splits,
    );
  }

  const partSum = splits.reduce((acc, s) => acc.plus(s.sum), Money.from(0));
  if (!partSum.equals(expense.sum)) {
    throw new BkError(
      'INVALID_SPLIT',
      `Split sums (${partSum.toString()}) do not match expense sum (${expense.sum})`,
      400,
      splits,
    );
  }
}
