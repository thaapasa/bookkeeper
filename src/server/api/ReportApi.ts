import { Router } from 'express';

import { ReportCreationData } from 'shared/expense';
import { createReport, deleteReport, getAllReports } from 'server/data/ReportDb';
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
  api.postTx('/all', { groupRequired: true }, (tx, session, {}) =>
    getAllReports(tx, session.group.id),
  );

  // POST /api/report
  // Create new report
  api.postTx('/', { body: ReportCreationData, groupRequired: true }, (tx, session, { body }) =>
    createReport(tx, session.group.id, session.user.id, body.title, body.query),
  );

  // DELETE /api/report
  // Delete report
  api.deleteTx('/:reportId', { groupRequired: true }, (tx, session, { params }) =>
    deleteReport(tx, session.group.id, params.reportId),
  );

  return api.router;
}
