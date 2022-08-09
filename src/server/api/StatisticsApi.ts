import { Router } from 'express';
import * as io from 'io-ts';

import { NonEmptyArray, validate } from 'shared/types/Validator';
import { db } from 'server/data/Db';
import { getCategoryStatistics } from 'server/data/Statistics';

import * as server from '../util/ServerUtil';

const CategoryIdsType = io.type({ categoryIds: NonEmptyArray(io.number) });

/**
 * Creates statistics API router.
 * Assumed attach path: `/api/statistics`
 */
export function createStatisticsApi() {
  const api = Router();

  // POST /api/statistics/category
  api.post(
    '/category',
    server.processRequest(async (session, req) => {
      const body = validate(CategoryIdsType, req.body);
      return db.tx(tx =>
        getCategoryStatistics(tx, session.group.id, body.categoryIds)
      );
    }, true)
  );

  return api;
}
