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
import { ApiMessage } from 'shared/types';
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
export function createExpenseApi() {
  const api = createValidatingRouter(Router());

  // Attach recurring expense API
  api.router.use('/recurring', createRecurringExpenseApi());

  // GET /api/expense/month
  api.getTx(
    '/month',
    { query: YearMonth, response: ExpenseCollection },
    (tx, session, { query }) =>
      getExpensesByMonth(
        tx,
        session.group.id,
        session.user.id,
        query.year,
        query.month
      ),
    true
  );

  // GET /api/expense/search?[ExpenseSearch]
  api.getTx(
    '/search',
    { query: ExpenseQuery, response: z.array(UserExpense) },
    (tx, session, { query }) =>
      searchExpenses(tx, session.user.id, session.group.id, query)
  );

  // POST /api/expense
  // Create new expense
  api.postTx(
    '/',
    { body: ExpenseInput, response: ApiMessage },
    (tx, session, { body }) =>
      createExpense(
        tx,
        session.user.id,
        session.group.id,
        body,
        session.group.defaultSourceId ?? 0
      ),
    true
  );

  const ExpenseSplitBody = z.object({
    splits: z.array(ExpenseSplit).nonempty(),
  });
  // POST /api/expense/[expenseId]/split
  api.postTx(
    '/:expenseId/split',
    { body: ExpenseSplitBody },
    (tx, session, { params, body }) =>
      splitExpense(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        body.splits
      ),
    true
  );

  // PUT /api/expense/[expenseId]
  // Update expense
  api.putTx(
    '/:expenseId',
    { body: ExpenseInput },
    (tx, session, { params, body }) =>
      updateExpenseById(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        body,
        session.group.defaultSourceId || 0
      ),
    true
  );

  // GET /api/expense/[expenseId]
  api.getTx(
    '/:expenseId',
    {},
    (tx, session, { params }) =>
      getExpenseWithDivision(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId
      ),
    true
  );

  // DELETE /api/expense/[expenseId]
  api.deleteTx(
    '/:expenseId',
    {},
    (tx, session, { params }) =>
      deleteExpenseById(tx, session.group.id, params.expenseId),
    true
  );

  return api.router;
}
