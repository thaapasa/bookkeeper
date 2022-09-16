import debug from 'debug';
import { ITask } from 'pg-promise';

import { Expense, ExpenseSplit } from 'shared/expense';
import { BkError } from 'shared/types/Errors';
import { Money } from 'shared/util';

import { BasicExpenseDb } from './BasicExpenseDb';
import { createExpense } from './BasicExpenseService';
import { toBaseExpense } from './ExpenseUtils';

const log = debug('bookkeeper:api:expenses');

export async function splitExpense(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  splits: ExpenseSplit[]
) {
  const expense = toBaseExpense(
    await BasicExpenseDb.getById(tx, groupId, userId, expenseId)
  );
  await checkSplits(splits, expense);
  log(`Splitting`, expense, 'to', splits);
  await Promise.all(splits.map(s => createSplit(tx, expense, s)));
  await BasicExpenseDb.deleteById(tx, groupId, expenseId);
  return {
    status: 'OK',
    message: `Splitted expense ${expenseId} into ${splits.length} parts`,
  };
}

async function createSplit(
  tx: ITask<any>,
  expense: Expense,
  split: ExpenseSplit
) {
  const splitted = { ...expense, ...split };
  log(`Creating new expense`, splitted);
  await createExpense(
    tx,
    expense.userId,
    expense.groupId,
    splitted,
    expense.groupId
  );
}

async function checkSplits(splits: ExpenseSplit[], expense: Expense) {
  if (splits.length < 2) {
    throw new BkError(
      'INVALID_SPLIT',
      'Expense splitting requires at least two splits',
      400,
      splits
    );
  }

  const partSum = splits.reduce((acc, s) => acc.plus(s.sum), Money.from(0));
  if (!partSum.equals(expense.sum)) {
    throw new BkError(
      'INVALID_SPLIT',
      `Split sums (${partSum.toString()}) do not match expense sum (${
        expense.sum
      })`,
      400,
      splits
    );
  }
}
