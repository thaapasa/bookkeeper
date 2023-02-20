import { Router } from 'express';

import { StatisticsSearchType } from 'shared/types';
import { getCategoryStatistics } from 'server/data/StatisticsDb';
import { getRangeForQueries } from 'server/data/StatisticsService';
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
    { body: StatisticsSearchType },
    async (tx, session, { body }) =>
      getCategoryStatistics(
        tx,
        session.group.id,
        session.user.id,
        body.categoryIds,
        getRangeForQueries(body.range),
        body.onlyOwn === true
      ),
    true
  );

  return api.router;
}
