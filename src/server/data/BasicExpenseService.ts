import { Expense, ExpenseDivisionItem, ExpenseInput } from 'shared/expense';
import { ExpenseIdResponse, ObjectId } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { withSpan } from 'server/telemetry/Spans';

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

export function createExpense(
  tx: DbTask,
  userId: number,
  groupId: number,
  expenseInput: ExpenseInput,
  defaultSourceId: number,
): Promise<ExpenseIdResponse> {
  return withSpan(
    'expense.create',
    {
      'app.user_id': userId,
      'app.group_id': groupId,
      'app.expense_type': expenseInput.type,
    },
    async () => {
      const expense = setExpenseDataDefaults(expenseInput);
      const sourceId = expense.sourceId || defaultSourceId;
      const cat = await getCategoryById(tx, groupId, expense.categoryId);
      const user = await getUserById(tx, groupId, expense.userId);
      const source = await getSourceById(tx, groupId, sourceId);

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
          groupingId: expense.groupingId,
        },
        division,
      );
      logger.debug(expense, 'Created expense %s', id);
      return { status: 'OK', message: 'Expense created', expenseId: id };
    },
  );
}

export function updateExpenseById(
  tx: DbTask,
  groupId: number,
  userId: number,
  expenseId: number,
  expense: ExpenseInput,
  defaultSourceId: number,
) {
  return withSpan(
    'expense.update',
    { 'app.user_id': userId, 'app.group_id': groupId, 'app.expense_id': expenseId },
    async () => {
      const e = await getExpenseById(tx, groupId, userId, expenseId);
      return updateExpense(tx, e, expense, defaultSourceId);
    },
  );
}

export async function copyExpense(
  tx: DbTask,
  groupId: number,
  userId: number,
  expenseId: number,
  mapper: (e: [Expense, ExpenseDivisionItem[]]) => [Expense, ExpenseDivisionItem[]],
) {
  const e = await getExpenseAndDivisionData(tx, groupId, userId, expenseId);
  const [expense, division] = mapper ? mapper(e) : e;
  return createNewExpense(tx, userId, expense, division);
}

export async function getExpenseAndDivisionData(
  tx: DbTask,
  groupId: number,
  userId: number,
  expenseId: number,
): Promise<[Expense, ExpenseDivisionItem[]]> {
  const expense = await getExpenseById(tx, groupId, userId, expenseId);
  const division = await getExpenseDivision(tx, expenseId);
  return [expense, division];
}

export function getExpenseWithDivision(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
): Promise<Expense & { division: ExpenseDivisionItem[] }> {
  return withSpan(
    'expense.get',
    { 'app.user_id': userId, 'app.group_id': groupId, 'app.expense_id': expenseId },
    async () => {
      const expense = await getExpenseById(tx, groupId, userId, expenseId);
      const division = await getExpenseDivision(tx, expenseId);
      return { ...expense, division };
    },
  );
}
