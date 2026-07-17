import { Router } from 'express';
import { z } from 'zod';

import { StatementRow, StatementUploadInput, StatementUploadResult } from 'shared/statement';
import { ISODate } from 'shared/time';
import { ObjectIdString } from 'shared/types';
import { getStatementRows, importStatement } from 'server/data/StatementDb';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

const StatementRowQuery = z.object({
  sourceId: ObjectIdString,
  startDate: ISODate.optional(),
  endDate: ISODate.optional(),
});

/**
 * Creates statement API router.
 * Assumed attach path: `/api/statement`
 */
export function createStatementApi() {
  const api = createValidatingRouter(Router());

  // POST /api/statement/upload/:sourceId
  api.postTx(
    '/upload/:sourceId',
    { body: StatementUploadInput, response: StatementUploadResult, groupRequired: true },
    (tx, session, { params, body }) =>
      importStatement(tx, session.group.id, params.sourceId, session.user.id, body),
  );

  // GET /api/statement/rows?sourceId=1&startDate=2026-01-01&endDate=2026-01-31
  api.getTx(
    '/rows',
    { query: StatementRowQuery, response: z.array(StatementRow), groupRequired: true },
    (tx, session, { query }) =>
      getStatementRows(tx, session.group.id, query.sourceId, query.startDate, query.endDate),
  );

  return api.router;
}
