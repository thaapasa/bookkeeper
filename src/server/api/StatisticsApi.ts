import { Router } from 'express';

import { CategoryStatistics, StatisticsSearchType, YearlySummary } from 'shared/types';
import { getCategoryStatistics, getYearlySummary } from 'server/data/StatisticsDb';
import { getRangeForQueries, getYearlySummaryRange } from 'server/data/StatisticsService';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates statistics API router.
 * Assumed attach path: `/api/statistics`
 */
export function createStatisticsApi() {
  const api = createValidatingRouter(Router());

  // POST /api/statistics/category
  api.postTx(
    '/category',
    { body: StatisticsSearchType, response: CategoryStatistics, groupRequired: true },
    async (tx, session, { body }) =>
      getCategoryStatistics(
        tx,
        session.group.id,
        session.user.id,
        body.categoryIds,
        getRangeForQueries(body.range),
        body.onlyOwn === true,
      ),
  );

  // GET /api/statistics/yearly
  api.getTx('/yearly', { response: YearlySummary, groupRequired: true }, (tx, session) =>
    getYearlySummary(tx, session.group.id, getYearlySummaryRange()),
  );

  return api.router;
}
