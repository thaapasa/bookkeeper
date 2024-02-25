import { Router } from 'express';

import { ExpenseGroupingData } from 'shared/types';
import { getExpenseGroupingsForUser } from 'server/data/grouping/GroupingDb';
import {
  createExpenseGrouping,
  deleteExpenseGrouping,
  deleteExpenseGroupingImage,
  getExpenseGrouping,
  getGroupingWithExpenses,
  updateExpenseGrouping,
  uploadExpenseGroupingImage,
} from 'server/data/grouping/GroupingService';
import { processFileUpload } from 'server/server/FileHandling';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates grouping API router.
 * Assumed attach path: `/api/grouping`
 */
export function createGroupingApi() {
  const api = createValidatingRouter(Router());

  // POST /api/grouping
  api.postTx('/', { body: ExpenseGroupingData }, (tx, session, { body }) =>
    createExpenseGrouping(tx, session.group.id, session.user.id, body),
  );

  // GET /api/grouping/list
  api.getTx('/list', {}, (tx, session, {}) => getExpenseGroupingsForUser(tx, session.group.id));

  // GET /api/grouping/:id
  api.getTx('/:id', {}, (tx, session, { params }) =>
    getExpenseGrouping(tx, session.group.id, params.id),
  );

  // GET /api/grouping/:id/expenses
  api.getTx('/:id/expenses', {}, (tx, session, { params }) =>
    getGroupingWithExpenses(tx, session.group.id, session.user.id, params.id),
  );

  // PUT /api/grouping/:id
  api.putTx('/:id', { body: ExpenseGroupingData }, (tx, session, { body, params }) =>
    updateExpenseGrouping(tx, session.group.id, session.user.id, params.id, body),
  );

  // DELETE /api/grouping/:id
  api.deleteTx('/:id', {}, (tx, session, { params }) =>
    deleteExpenseGrouping(tx, session.group.id, session.user.id, params.id),
  );

  // POST /api/grouping/:id/image
  api.postTx(
    '/:id/image',
    {},
    processFileUpload((tx, session, file, { params }) =>
      uploadExpenseGroupingImage(tx, session.group.id, session.user.id, params.id, file),
    ),
  );

  // DELETE /api/grouping/:id/image
  api.deleteTx('/:id/image', {}, (tx, session, { params }) =>
    deleteExpenseGroupingImage(tx, session.group.id, session.user.id, params.id),
  );

  return api.router;
}
