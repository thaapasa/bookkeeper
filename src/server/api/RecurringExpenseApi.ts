import { Router } from 'express';
import { z } from 'zod';

import {
  ExpenseInput,
  RecurringExpenseInput,
  RecurringExpenseTarget,
} from 'shared/expense';
import { Expenses } from 'server/data/Expenses';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates recurring expense API.
 *
 * This API provides a view of the recurring expenses form the point of view of the individual expenses.
 * This means all the ids passed to the API are expense ids, not ids of the recurring expense objects.
 *
 * Assumed attach path: `/api/expense/recurring`
 */
export function createRecurringExpenseApi() {
  const api = createValidatingRouter(Router());

  const RecurringExpenseTargetSchema = z.object({
    target: RecurringExpenseTarget,
  });

  // POST /api/expense/recurring/[expenseId]
  // Create a new recurring expense from the selected expense
  api.postTx(
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
      Expenses.deleteRecurringByExpenseId(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        query.target
      ),
    true
  );

  // PUT /api/expense/recurring/[expenseId]
  // Update recurring expense details
  api.putTx(
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
