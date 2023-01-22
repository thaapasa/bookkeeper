import { Router } from 'express';
import { z } from 'zod';

import {
  ExpenseCollection,
  ExpenseInput,
  ExpenseQuery,
  ExpenseSplit,
  RecurringExpenseInput,
  RecurringExpenseTarget,
  UserExpense,
} from 'shared/expense';
import { YearMonth } from 'shared/time';
import { ApiMessage } from 'shared/types';
import {
  getExpenseAndDivision,
  updateExpenseById,
} from 'server/data/BasicExpenseService';
import { Expenses } from 'server/data/Expenses';
import { searchExpenses } from 'server/data/ExpenseSearch';
import { splitExpense } from 'server/data/ExpenseSplit';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

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
      Expenses.getByMonth(
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

  // PUT /api/expense
  api.putTx(
    '/',
    { body: ExpenseInput, response: ApiMessage },
    (tx, session, { body }) =>
      Expenses.create(
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

  // POST /api/expense/[expenseId]
  api.postTx(
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
      getExpenseAndDivision(
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
      Expenses.deleteById(tx, session.group.id, params.expenseId),
    true
  );

  return api.router;
}

/**
 * Creates recurring expense API.
 * Assumed attach path: `/api/expense/recurring`
 */
function createRecurringExpenseApi() {
  const api = createValidatingRouter(Router());

  const RecurringExpenseTargetSchema = z.object({
    target: RecurringExpenseTarget,
  });

  // GET /api/expense/recurring/all
  api.getTx(
    '/all',
    {},
    (tx, session, {}) => Expenses.getRecurringExpenses(tx, session.group.id),
    true
  );

  // PUT /api/expense/recurring/[expenseId]
  api.putTx(
    '/:expenseId',
    { body: RecurringExpenseInput },
    (tx, session, { body, params }) =>
      Expenses.createRecurring(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        body
      ),
    true
  );

  // DELETE /api/expense/recurring/[expenseId]
  api.deleteTx(
    '/:expenseId',
    { query: RecurringExpenseTargetSchema },
    (tx, session, { query, params }) =>
      Expenses.deleteRecurringById(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        query.target
      ),
    true
  );

  // POST /api/expense/recurring/[expenseId]
  api.postTx(
    '/:expenseId',
    {
      query: RecurringExpenseTargetSchema,
      body: ExpenseInput,
    },
    (tx, session, { query, params, body }) =>
      Expenses.updateRecurring(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        query.target,
        body,
        session.group.defaultSourceId || 0
      ),
    true
  );

  return api.router;
}
