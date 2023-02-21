import { Router } from 'express';

import { ReportCreationData } from 'shared/expense';
import { Reports } from 'server/data/Reports';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates reports API.
 *
 * Assumed attach path: `/api/report`
 */
export function createReportApi() {
  const api = createValidatingRouter(Router());

  // GET /api/report/all
  // Get all reports
  api.postTx(
    '/all',
    {},
    (tx, session, {}) => Reports.getAll(tx, session.group.id),
    true
  );

  // POST /api/report
  // Create new report
  api.postTx(
    '/',
    { body: ReportCreationData },
    (tx, session, { body }) =>
      Reports.createReport(
        tx,
        session.group.id,
        session.user.id,
        body.title,
        body.query
      ),
    true
  );

  return api.router;
}
