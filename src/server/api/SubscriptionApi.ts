import { Router } from 'express';

import {
  QuerySummary,
  SubscriptionCreatedResponse,
  SubscriptionDeleteQuery,
  SubscriptionFromFilter,
  SubscriptionMatches,
  SubscriptionMatchesQuery,
  SubscriptionPreviewRequest,
  SubscriptionResult,
  SubscriptionSearchCriteria,
  SubscriptionUpdate,
} from 'shared/expense';
import { ApiMessage } from 'shared/types';
import {
  createSubscriptionFromFilter,
  deleteSubscriptionById,
  updateSubscription,
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
 * card model (see docs/archive/SUBSCRIPTIONS_REWORK_PLAN.md). After step 5 the
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
    { body: SubscriptionPreviewRequest, response: QuerySummary, groupRequired: true },
    (tx, session, { body }) =>
      summarizeQuery(
        tx,
        session.group.id,
        session.user.id,
        body.filter,
        body.range,
        body.limit ?? 0,
      ),
  );

  // POST /api/subscription/matches
  api.postTx(
    '/matches',
    { body: SubscriptionMatchesQuery, response: SubscriptionMatches, groupRequired: true },
    (tx, session, { body }) => getSubscriptionMatches(tx, session.group.id, session.user.id, body),
  );

  // DELETE /api/subscription/[subscriptionId]?mode=end|delete
  // mode=end soft-ends an ongoing recurring row; mode=delete hard-deletes any
  // other row (already-ended recurring or non-recurring stats). The server
  // verifies the asserted mode against the row's current state — see
  // `deleteSubscriptionById` for the race-protection rationale.
  api.deleteTx(
    '/:subscriptionId',
    { query: SubscriptionDeleteQuery, response: ApiMessage, groupRequired: true },
    (tx, session, { params, query }) =>
      deleteSubscriptionById(tx, session.group.id, params.subscriptionId, query.mode),
  );

  // PATCH /api/subscription/[subscriptionId]
  // Partial update of title / filter / defaults. Recurrence cadence and
  // occurs_until are owned by other flows and not touched here.
  api.patchTx(
    '/:subscriptionId',
    { body: SubscriptionUpdate, response: ApiMessage, groupRequired: true },
    (tx, session, { body, params }) =>
      updateSubscription(tx, session.group.id, params.subscriptionId, body),
  );

  return api.router;
}
