import { Router } from 'express';

import { ExpenseInput, SubscriptionSearchCriteria } from 'shared/expense';
import {
  deleteRecurringExpenseById,
  getRecurringExpenseDetails,
  getRecurringExpenseTemplate,
  updateRecurringExpenseTemplate,
} from 'server/data/RecurringExpenseDb';
import { searchSubscriptions } from 'server/data/SubscriptionService';
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
    { body: SubscriptionSearchCriteria, groupRequired: true },
    (tx, session, { body }) => searchSubscriptions(tx, session.group.id, session.user.id, body),
  );

  // GET /api/subscription/[recurringExpenseId]
  // Get subscription details
  api.getTx('/:recurringExpenseId', { groupRequired: true }, (tx, session, { params }) =>
    getRecurringExpenseDetails(tx, session.group.id, session.user.id, params.recurringExpenseId),
  );

  // GET /api/subscription/[recurringExpenseId]
  // Get subscription template
  api.getTx('/:recurringExpenseId/template', { groupRequired: true }, (tx, session, { params }) =>
    getRecurringExpenseTemplate(tx, session.group.id, session.user.id, params.recurringExpenseId),
  );

  // PUT /api/subscription/template/[expenseId]
  // Update subscription template. Note: template expense id used, not subscription (recurring expense) id
  api.putTx(
    '/template/:expenseId',
    { body: ExpenseInput, groupRequired: true },
    (tx, session, { params, body }) =>
      updateRecurringExpenseTemplate(
        tx,
        session.group.id,
        session.user.id,
        params.expenseId,
        body,
        session.group.defaultSourceId || 0,
      ),
  );

  // DELETE /api/subscription/[recurringExpenseId]
  // Deletes a subscription, leaving the realized expenses in place
  api.deleteTx('/:recurringExpenseId', { groupRequired: true }, (tx, session, { params }) =>
    deleteRecurringExpenseById(tx, session.group.id, params.recurringExpenseId),
  );

  return api.router;
}
