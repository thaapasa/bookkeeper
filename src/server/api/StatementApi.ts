import { Router } from 'express';
import { z } from 'zod';

import {
  StatementRowsResponse,
  StatementUploadDeleteResult,
  StatementUploadInput,
  StatementUploadListItem,
  StatementUploadResult,
} from 'shared/statement';
import { ISODate } from 'shared/time';
import { IntString, ObjectIdString } from 'shared/types';
import {
  deleteStatementUpload,
  getStatementRows,
  getStatementUploads,
  importStatement,
} from 'server/data/StatementDb';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

const StatementRowQuery = z.object({
  sourceId: ObjectIdString,
  startDate: ISODate.optional(),
  endDate: ISODate.optional(),
  limit: IntString.refine(n => n >= 1 && n <= MAX_PAGE_SIZE).optional(),
  offset: IntString.refine(n => n >= 0).optional(),
});

const StatementUploadsQuery = z.object({
  sourceId: ObjectIdString,
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

  // GET /api/statement/uploads?sourceId=1
  api.getTx(
    '/uploads',
    {
      query: StatementUploadsQuery,
      response: z.array(StatementUploadListItem),
      groupRequired: true,
    },
    (tx, session, { query }) => getStatementUploads(tx, session.group.id, query.sourceId),
  );

  // DELETE /api/statement/upload/:uploadId
  api.deleteTx(
    '/upload/:uploadId',
    { response: StatementUploadDeleteResult, groupRequired: true },
    (tx, session, { params }) => deleteStatementUpload(tx, session.group.id, params.uploadId),
  );

  // GET /api/statement/rows?sourceId=1&startDate=2026-01-01&endDate=2026-01-31&limit=50&offset=0
  api.getTx(
    '/rows',
    { query: StatementRowQuery, response: StatementRowsResponse, groupRequired: true },
    (tx, session, { query }) =>
      getStatementRows(tx, session.group.id, query.sourceId, {
        startDate: query.startDate,
        endDate: query.endDate,
        limit: query.limit ?? DEFAULT_PAGE_SIZE,
        offset: query.offset ?? 0,
      }),
  );

  return api.router;
}
