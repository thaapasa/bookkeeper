import { Router } from 'express';

import { StatisticsSearchType } from 'shared/types/Statistics';
import { StatisticsDb } from 'server/data/StatisticsDb';
import { getRangeForQueries } from 'server/data/StatisticsService';
import { Requests } from 'server/server/RequestHandling';

/**
 * Creates statistics API router.
 * Assumed attach path: `/api/statistics`
 */
export function createStatisticsApi() {
  const api = Router();

  // POST /api/statistics/category
  api.post(
    '/category',
    Requests.validatedTxRequest(
      { body: StatisticsSearchType },
      async (tx, session, { body }) =>
        StatisticsDb.getCategoryStatistics(
          tx,
          session.group.id,
          session.user.id,
          body.categoryIds,
          getRangeForQueries(body.range),
          body.onlyOwn === true
        ),
      true
    )
  );

  return api;
}
