import { Router } from 'express';

import {
  ExpenseInput,
  ExpenseQuery,
  QuerySummary,
  RecurringExpenseDetails,
  SubscriptionMatches,
  SubscriptionMatchesQuery,
  SubscriptionResult,
  SubscriptionSearchCriteria,
  UserExpense,
} from 'shared/expense';
import { ApiMessage, ExpenseIdResponse } from 'shared/types';
import {
  deleteRecurringExpenseById,
  getRecurringExpenseDetails,
  getRecurringExpenseTemplate,
  updateRecurringExpenseTemplate,
} from 'server/data/RecurringExpenseDb';
import {
  getSubscriptionMatches,
  searchSubscriptions,
  summarizeQuery,
} from 'server/data/SubscriptionService';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates subscription API.
 *
 * This API provides a view of recurring expenses and reports unified
 * as subscriptions, without requiring knowledge of either underlying
 * table. (See `docs/SUBSCRIPTIONS_REWORK_PLAN.md` for the model.)
 *
 * Assumed attach path: `/api/subscription`
 */
export function createSubscriptionApi() {
  const api = createValidatingRouter(Router());

  // POST /api/subscription/search
  // Search for subscriptions (returns a flat list of subscription cards)
  api.postTx(
    '/search',
    {
      body: SubscriptionSearchCriteria,
      response: SubscriptionResult,
      groupRequired: true,
    },
    (tx, session, { body }) => searchSubscriptions(tx, session.group.id, session.user.id, body),
  );

  // POST /api/subscription/query-summary
  // Compute count + sum for an arbitrary ExpenseQuery, used by the
  // create/edit dialog to preview a filter before saving.
  api.postTx(
    '/query-summary',
    { body: ExpenseQuery, response: QuerySummary, groupRequired: true },
    (tx, session, { body }) => summarizeQuery(tx, session.group.id, body),
  );

  // POST /api/subscription/matches
  // Return the realised expense rows that the dedup pass currently
  // assigns to the given subscription (optionally narrowed to one
  // category for report cards). Powers the matched-rows expander.
  api.postTx(
    '/matches',
    { body: SubscriptionMatchesQuery, response: SubscriptionMatches, groupRequired: true },
    (tx, session, { body }) => getSubscriptionMatches(tx, session.group.id, session.user.id, body),
  );

  // GET /api/subscription/[recurringExpenseId]
  // Get subscription details
  api.getTx(
    '/:recurringExpenseId',
    { response: RecurringExpenseDetails, groupRequired: true },
    (tx, session, { params }) =>
      getRecurringExpenseDetails(tx, session.group.id, session.user.id, params.recurringExpenseId),
  );

  // GET /api/subscription/[recurringExpenseId]/template
  // Get subscription template expense
  api.getTx(
    '/:recurringExpenseId/template',
    { response: UserExpense, groupRequired: true },
    (tx, session, { params }) =>
      getRecurringExpenseTemplate(tx, session.group.id, session.user.id, params.recurringExpenseId),
  );

  // PUT /api/subscription/template/[expenseId]
  // Update subscription template. Note: template expense id used, not subscription (recurring expense) id
  api.putTx(
    '/template/:expenseId',
    { body: ExpenseInput, response: ExpenseIdResponse, groupRequired: true },
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
  api.deleteTx(
    '/:recurringExpenseId',
    { response: ApiMessage, groupRequired: true },
    (tx, session, { params }) =>
      deleteRecurringExpenseById(tx, session.group.id, params.recurringExpenseId),
  );

  return api.router;
}
