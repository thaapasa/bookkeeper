import debug from 'debug';
import { ITask } from 'pg-promise';

import { Expense, ExpenseDivisionItem, ExpenseInput } from 'shared/expense';
import { ApiMessage, ObjectId } from 'shared/types';

import { BasicExpenseDb } from './BasicExpenseDb';
import { CategoryDb } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { SourceDb } from './SourceDb';
import { UserDb } from './UserDb';

const log = debug('bookkeeper:api:expenses');

export async function createExpense(
  tx: ITask<any>,
  userId: number,
  groupId: number,
  expenseInput: ExpenseInput,
  defaultSourceId: number
): Promise<ApiMessage> {
  const expense = BasicExpenseDb.setDefaults(expenseInput);
  const sourceId = expense.sourceId || defaultSourceId;
  const [cat, user, source] = await Promise.all([
    CategoryDb.getById(tx, groupId, expense.categoryId),
    UserDb.getById(tx, groupId, expense.userId),
    SourceDb.getById(tx, groupId, sourceId),
  ]);

  const division = determineDivision(expense, source);
  const id = await BasicExpenseDb.insert(
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
    division
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
  defaultSourceId: number
) {
  const e = await BasicExpenseDb.getById(tx, groupId, userId, expenseId);
  return BasicExpenseDb.update(tx, e, expense, defaultSourceId);
}

export async function copyExpense(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  mapper: (
    e: [Expense, ExpenseDivisionItem[]]
  ) => [Expense, ExpenseDivisionItem[]]
) {
  const e = await BasicExpenseDb.getExpenseAndDivision(
    tx,
    groupId,
    userId,
    expenseId
  );
  const [expense, division] = mapper ? mapper(e) : e;
  return BasicExpenseDb.insert(tx, userId, expense, division);
}

export async function getExpenseAndDivision(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId
): Promise<Expense & { division: ExpenseDivisionItem[] }> {
  const [expense, division] = await Promise.all([
    BasicExpenseDb.getById(tx, groupId, userId, expenseId),
    BasicExpenseDb.getDivision(tx, expenseId),
  ]);
  return { ...expense, division };
}
