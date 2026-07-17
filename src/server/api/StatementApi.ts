import { Router } from 'express';
import { z } from 'zod';

import {
  SkipInput,
  StatementMatchBulkInput,
  StatementMatchingData,
  StatementMatchInput,
  StatementRowsResponse,
  StatementUploadDeleteResult,
  StatementUploadInput,
  StatementUploadListItem,
  StatementUploadResult,
} from 'shared/statement';
import { ISODate, ISOMonth } from 'shared/time';
import { IntString, ObjectIdString } from 'shared/types';
import {
  deleteStatementUpload,
  getStatementRows,
  getStatementUploads,
  importStatement,
} from 'server/data/StatementDb';
import {
  createStatementMatch,
  deleteMatchesForStatementRow,
  deleteMatchForExpense,
  getStatementMatchingData,
  setExpenseStatementSkip,
  setStatementRowSkipped,
} from 'server/data/StatementMatchDb';
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

const StatementMatchingQuery = z.object({
  sourceId: ObjectIdString,
  month: ISOMonth,
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

  // GET /api/statement/matching?sourceId=1&month=2026-05
  api.getTx(
    '/matching',
    { query: StatementMatchingQuery, response: StatementMatchingData, groupRequired: true },
    (tx, session, { query }) =>
      getStatementMatchingData(tx, session.group.id, query.sourceId, query.month),
  );

  // POST /api/statement/match
  api.postTx(
    '/match',
    { body: StatementMatchInput, groupRequired: true },
    async (tx, session, { body }) => {
      await createStatementMatch(tx, session.group.id, body);
      return { status: 'OK' };
    },
  );

  // POST /api/statement/match/bulk
  api.postTx(
    '/match/bulk',
    { body: StatementMatchBulkInput, groupRequired: true },
    async (tx, session, { body }) => {
      for (const match of body.matches) {
        await createStatementMatch(tx, session.group.id, match);
      }
      return { status: 'OK', count: body.matches.length };
    },
  );

  // DELETE /api/statement/match/statement/:statementRowId
  api.deleteTx(
    '/match/statement/:statementRowId',
    { groupRequired: true },
    async (tx, session, { params }) => {
      await deleteMatchesForStatementRow(tx, session.group.id, params.statementRowId);
      return { status: 'OK' };
    },
  );

  // DELETE /api/statement/match/expense/:expenseId
  api.deleteTx(
    '/match/expense/:expenseId',
    { groupRequired: true },
    async (tx, session, { params }) => {
      await deleteMatchForExpense(tx, session.group.id, params.expenseId);
      return { status: 'OK' };
    },
  );

  // PATCH /api/statement/row/:statementRowId/skip
  api.patchTx(
    '/row/:statementRowId/skip',
    { body: SkipInput, groupRequired: true },
    async (tx, session, { params, body }) => {
      await setStatementRowSkipped(tx, session.group.id, params.statementRowId, body.skipped);
      return { status: 'OK' };
    },
  );

  // PATCH /api/statement/expense/:expenseId/skip
  api.patchTx(
    '/expense/:expenseId/skip',
    { body: SkipInput, groupRequired: true },
    async (tx, session, { params, body }) => {
      await setExpenseStatementSkip(tx, session.group.id, params.expenseId, body.skipped);
      return { status: 'OK' };
    },
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
