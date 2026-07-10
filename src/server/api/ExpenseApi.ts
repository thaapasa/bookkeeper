import { Router } from 'express';
import { z } from 'zod';

import {
  ExpenseCollection,
  ExpenseInput,
  ExpenseQuery,
  ExpenseSplit,
  UserExpense,
} from 'shared/expense';
import { YearMonth } from 'shared/time';
import { ApiMessage, ExpenseIdResponse } from 'shared/types';
import { deleteExpenseById } from 'server/data/BasicExpenseDb';
import {
  createExpense,
  getExpenseWithDivision,
  updateExpenseById,
} from 'server/data/BasicExpenseService';
import { getExpensesByMonth } from 'server/data/Expenses';
import { searchExpenses } from 'server/data/ExpenseSearch';
import { splitExpense } from 'server/data/ExpenseSplit';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

import { createRecurringExpenseApi } from './RecurringExpenseApi';

/**
 * Creates expense API router.
 * Assumed attach path: `/api/expense`
 */
/**
 * The foreign currency annotation is all-or-nothing. Refining here rather than on
 * `ExpenseInput` keeps that schema a plain ZodObject so it stays composable, and turns what
 * the DB CHECK would report as a 500 into a clean 400.
 */
const ExpenseInputBody = ExpenseInput.refine(
  e => (e.currencyId == null) === (e.originalCurrencyValue == null),
  { message: 'currencyId and originalCurrencyValue must be set together' },
);

export function createExpenseApi() {
  const api = createValidatingRouter(Router());

  // Attach recurring expense API
  api.router.use('/recurring', createRecurringExpenseApi());

  // GET /api/expense/month
  api.getTx(
    '/month',
    { query: YearMonth, response: ExpenseCollection, groupRequired: true },
    (tx, session, { query }) =>
      getExpensesByMonth(tx, session.group.id, session.user.id, query.year, query.month),
  );

  // GET /api/expense/search?[ExpenseSearch]
  api.postTx(
    '/search',
    { body: ExpenseQuery, response: z.array(UserExpense), groupRequired: true },
    (tx, session, { body }) => searchExpenses(tx, session.user.id, session.group.id, body),
  );

  // POST /api/expense
  // Create new expense
  api.postTx(
    '/',
    { body: ExpenseInputBody, response: ExpenseIdResponse, groupRequired: true },
    (tx, session, { body }) =>
      createExpense(
        tx,
        session.user.id,
        session.group.id,
        body,
        session.group.defaultSourceId ?? 0,
      ),
  );

  const ExpenseSplitBody = z.object({
    splits: z.array(ExpenseSplit).min(1),
  });
  // POST /api/expense/[expenseId]/split
  api.postTx(
    '/:expenseId/split',
    { body: ExpenseSplitBody, response: ApiMessage, groupRequired: true },
    (tx, session, { params, body }) =>
      splitExpense(tx, session.group.id, session.user.id, params.expenseId, body.splits),
  );

  // PUT /api/expense/[expenseId]
  // Update expense
  api.putTx(
    '/:expenseId',
    { body: ExpenseInputBody, response: ExpenseIdResponse, groupRequired: true },
    (tx, session, { params, body }) =>
      updateExpenseById(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        body,
        session.group.defaultSourceId || 0,
      ),
  );

  // GET /api/expense/[expenseId]
  api.getTx('/:expenseId', { groupRequired: true }, (tx, session, { params }) =>
    getExpenseWithDivision(tx, session.group.id, session.user.id, params.expenseId),
  );

  // DELETE /api/expense/[expenseId]
  api.deleteTx(
    '/:expenseId',
    { response: ExpenseIdResponse, groupRequired: true },
    (tx, session, { params }) => deleteExpenseById(tx, session.group.id, params.expenseId),
  );

  return api.router;
}
