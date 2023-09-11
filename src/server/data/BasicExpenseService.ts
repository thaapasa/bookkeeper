import debug from 'debug';
import { ITask } from 'pg-promise';

import { Expense, ExpenseDivisionItem, ExpenseInput } from 'shared/expense';
import { ApiMessage, ObjectId } from 'shared/types';

import {
  createNewExpense,
  getExpenseById,
  getExpenseDivision,
  setExpenseDataDefaults,
  updateExpense,
} from './BasicExpenseDb';
import { getCategoryById } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { getSourceById } from './SourceDb';
import { getUserById } from './UserDb';

const log = debug('bookkeeper:api:expenses');

export async function createExpense(
  tx: ITask<any>,
  userId: number,
  groupId: number,
  expenseInput: ExpenseInput,
  defaultSourceId: number,
): Promise<ApiMessage> {
  const expense = setExpenseDataDefaults(expenseInput);
  const sourceId = expense.sourceId || defaultSourceId;
  const [cat, user, source] = await Promise.all([
    getCategoryById(tx, groupId, expense.categoryId),
    getUserById(tx, groupId, expense.userId),
    getSourceById(tx, groupId, sourceId),
  ]);

  const division = determineDivision(expense, source);
  const id = await createNewExpense(
    tx,
    userId,
    {
      ...expense,
      userId: user.id,
      groupId,
      sourceId: source.id,
      categoryId: cat.id,
      sum: expense.sum,
    },
    division,
  );
  log('Created expense', id, expense);
  return { status: 'OK', message: 'Expense created', expenseId: id };
}

export async function updateExpenseById(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  expense: ExpenseInput,
  defaultSourceId: number,
) {
  const e = await getExpenseById(tx, groupId, userId, expenseId);
  return updateExpense(tx, e, expense, defaultSourceId);
}

export async function copyExpense(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  mapper: (e: [Expense, ExpenseDivisionItem[]]) => [Expense, ExpenseDivisionItem[]],
) {
  const e = await getExpenseAndDivisionData(tx, groupId, userId, expenseId);
  const [expense, division] = mapper ? mapper(e) : e;
  return createNewExpense(tx, userId, expense, division);
}

export const getExpenseAndDivisionData = (
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
): Promise<[Expense, ExpenseDivisionItem[]]> =>
  Promise.all([getExpenseById(tx, groupId, userId, expenseId), getExpenseDivision(tx, expenseId)]);

export async function getExpenseWithDivision(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
): Promise<Expense & { division: ExpenseDivisionItem[] }> {
  const [expense, division] = await Promise.all([
    getExpenseById(tx, groupId, userId, expenseId),
    getExpenseDivision(tx, expenseId),
  ]);
  return { ...expense, division };
}
