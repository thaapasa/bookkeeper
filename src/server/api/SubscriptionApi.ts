import { Router } from 'express';

import { ExpenseInput, RecurringExpenseCriteria } from 'shared/expense';
import {
  deleteRecurringExpenseById,
  getRecurringExpenseDetails,
  getRecurringExpenseTemplate,
  searchRecurringExpenses,
  updateRecurringExpenseTemplate,
} from 'server/data/RecurringExpenseDb';
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
      searchRecurringExpenses(tx, session.group.id, session.user.id, body),
    true
  );

  // GET /api/subscription/[recurringExpenseId]
  // Get subscription details
  api.getTx(
    '/:recurringExpenseId',
    {},
    (tx, session, { params }) =>
      getRecurringExpenseDetails(
        tx,
        session.group.id,
        session.user.id,
        params.recurringExpenseId
      ),
    true
  );

  // GET /api/subscription/[recurringExpenseId]
  // Get subscription template
  api.getTx(
    '/:recurringExpenseId/template',
    {},
    (tx, session, { params }) =>
      getRecurringExpenseTemplate(
        tx,
        session.group.id,
        session.user.id,
        params.recurringExpenseId
      ),
    true
  );

  // PUT /api/subscription/template/[expenseId]
  // Update subscription template. Note: template expense id used, not subscription (recurring expense) id
  api.putTx(
    '/template/:expenseId',
    { body: ExpenseInput },
    (tx, session, { params, body }) =>
      updateRecurringExpenseTemplate(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        body,
        session.group.defaultSourceId || 0
      ),
    true
  );

  // DELETE /api/subscription/[recurringExpenseId]
  // Deletes a subscription, leaving the realized expenses in place
  api.deleteTx(
    '/:recurringExpenseId',
    {},
    (tx, session, { params }) =>
      deleteRecurringExpenseById(
        tx,
        session.group.id,
        params.recurringExpenseId
      ),
    true
  );

  return api.router;
}
