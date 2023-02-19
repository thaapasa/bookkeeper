import { Router } from 'express';

import { RecurringExpenseCriteria } from 'shared/expense';
import { Expenses } from 'server/data/Expenses';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates subscription API.
 *
 * This API provides a view of the recurring expenses as subscriptions,
 * without requiring knowledge of the individual expense objects.
 *
 * Assumed attach path: `/api/subscription`
 */
export function createSubscriptionApi() {
  const api = createValidatingRouter(Router());

  // GET /api/subscription/search
  // Search for subscription
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

  // GET /api/subscription/[recurringExpenseId]
  // Get subscription details
  api.getTx(
    '/:recurringExpenseId',
    {},
    (tx, session, { params }) =>
      Expenses.getRecurringExpenseDetails(
        tx,
        session.group.id,
        session.user.id,
        params.recurringExpenseId
      ),
    true
  );

  // DELETE /api/subscription/[recurringExpenseId]
  // Deletes a subscription, leaving the realized expenses in place
  api.deleteTx(
    '/:recurringExpenseId',
    {},
    (tx, session, { params }) =>
      Expenses.deleteRecurringById(
        tx,
        session.group.id,
        params.recurringExpenseId
      ),
    true
  );

  return api.router;
}
