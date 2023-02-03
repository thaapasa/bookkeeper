import { Router } from 'express';
import { z } from 'zod';

import {
  ExpenseInput,
  RecurringExpenseCriteria,
  RecurringExpenseInput,
  RecurringExpenseTarget,
} from 'shared/expense';
import { Expenses } from 'server/data/Expenses';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates recurring expense API.
 * Assumed attach path: `/api/expense/recurring`
 */
export function createRecurringExpenseApi() {
  const api = createValidatingRouter(Router());

  const RecurringExpenseTargetSchema = z.object({
    target: RecurringExpenseTarget,
  });

  // GET /api/expense/recurring/search
  api.postTx(
    '/search',
    { body: RecurringExpenseCriteria },
    (tx, session, { body }) =>
      Expenses.searchRecurringExpenses(
        tx,
        session.group.id,
        session.user.id,
        body
      ),
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
