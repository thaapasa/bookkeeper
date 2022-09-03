import debug from 'debug';
import { IBaseProtocol } from 'pg-promise';

import { ApiMessage } from 'shared/types/Api';
import { Expense, ExpenseDivisionItem } from 'shared/types/Expense';

import { BasicExpenseDb } from './BasicExpenseDb';
import { CategoryDb } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { SourceDb } from './SourceDb';
import { UserDb } from './UserDb';

const log = debug('bookkeeper:api:expenses');

export async function createExpense(
  tx: IBaseProtocol<any>,
  userId: number,
  groupId: number,
  expense: Expense,
  defaultSourceId: number
): Promise<ApiMessage> {
  expense = BasicExpenseDb.setDefaults(expense);
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
  tx: IBaseProtocol<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  expense: Expense,
  defaultSourceId: number
) {
  const e = await BasicExpenseDb.getById(tx, groupId, userId, expenseId);
  return BasicExpenseDb.update(tx, e, expense, defaultSourceId);
}

export async function copyExpense(
  tx: IBaseProtocol<any>,
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