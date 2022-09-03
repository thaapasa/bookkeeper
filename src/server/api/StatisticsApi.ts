import { Router } from 'express';

import {
  CategoryStatistics,
  StatisticsSearchType,
} from 'shared/types/Statistics';
import { validate } from 'shared/types/Validator';
import { StatisticsDb } from 'server/data/Statistics';
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
    Requests.txRequest<CategoryStatistics>(async (tx, session, req) => {
      const body = validate(StatisticsSearchType, req.body);
      return StatisticsDb.getCategoryStatistics(
        tx,
        session.group.id,
        body.categoryIds
      );
    }, true)
  );

  return api;
}
