import { Router } from 'express';

import {
  ExpenseQuery,
  QuerySummary,
  SubscriptionCreatedResponse,
  SubscriptionFromFilter,
  SubscriptionMatches,
  SubscriptionMatchesQuery,
  SubscriptionResult,
  SubscriptionSearchCriteria,
} from 'shared/expense';
import { ApiMessage } from 'shared/types';
import {
  createSubscriptionFromFilter,
  deleteRecurringExpenseById,
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
 * Subscriptions unify recurring expenses and reports into a single
 * card model (see docs/SUBSCRIPTIONS_REWORK_PLAN.md). After step 5 the
 * /template endpoints are gone — template-row editing is replaced by
 * editing a realised row with target=`all`/`after`, which propagates
 * to the subscription's `defaults` JSONB.
 *
 * Assumed attach path: `/api/subscription`
 */
export function createSubscriptionApi() {
  const api = createValidatingRouter(Router());

  // POST /api/subscription/search
  api.postTx(
    '/search',
    {
      body: SubscriptionSearchCriteria,
      response: SubscriptionResult,
      groupRequired: true,
    },
    (tx, session, { body }) => searchSubscriptions(tx, session.group.id, session.user.id, body),
  );

  // POST /api/subscription/from-filter
  // Save the current filter (and a title) as a non-recurring subscription.
  // Replaces the old `POST /api/report` "save report" path.
  api.postTx(
    '/from-filter',
    {
      body: SubscriptionFromFilter,
      response: SubscriptionCreatedResponse,
      groupRequired: true,
    },
    (tx, session, { body }) =>
      createSubscriptionFromFilter(tx, session.group.id, session.user.id, body.title, body.filter),
  );

  // POST /api/subscription/query-summary
  api.postTx(
    '/query-summary',
    { body: ExpenseQuery, response: QuerySummary, groupRequired: true },
    (tx, session, { body }) => summarizeQuery(tx, session.group.id, body),
  );

  // POST /api/subscription/matches
  api.postTx(
    '/matches',
    { body: SubscriptionMatchesQuery, response: SubscriptionMatches, groupRequired: true },
    (tx, session, { body }) => getSubscriptionMatches(tx, session.group.id, session.user.id, body),
  );

  // DELETE /api/subscription/[subscriptionId]
  // Ends the subscription (sets occurs_until = today). Realised rows stay.
  api.deleteTx(
    '/:subscriptionId',
    { response: ApiMessage, groupRequired: true },
    (tx, session, { params }) =>
      deleteRecurringExpenseById(tx, session.group.id, params.subscriptionId),
  );

  return api.router;
}
