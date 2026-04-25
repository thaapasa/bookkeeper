import { Router } from 'express';
import { z } from 'zod';

import { ReportCreationData, ReportDef } from 'shared/expense';
import { ApiMessage } from 'shared/types';
import { createReport, deleteReport, getAllReports, updateReport } from 'server/data/ReportDb';
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
  api.postTx('/all', { response: z.array(ReportDef), groupRequired: true }, (tx, session, {}) =>
    getAllReports(tx, session.group.id),
  );

  // POST /api/report
  // Create new report
  api.postTx(
    '/',
    { body: ReportCreationData, response: ReportDef, groupRequired: true },
    (tx, session, { body }) =>
      createReport(tx, session.group.id, session.user.id, body.title, body.query),
  );

  // PUT /api/report/[reportId]
  // Update an existing report
  api.putTx(
    '/:reportId',
    { body: ReportCreationData, response: ReportDef, groupRequired: true },
    (tx, session, { body, params }) =>
      updateReport(tx, session.group.id, params.reportId, body.title, body.query),
  );

  // DELETE /api/report/[reportId]
  api.deleteTx(
    '/:reportId',
    { response: ApiMessage, groupRequired: true },
    (tx, session, { params }) => deleteReport(tx, session.group.id, params.reportId),
  );

  return api.router;
}
