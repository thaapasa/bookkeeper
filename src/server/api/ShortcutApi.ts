import { Router } from 'express';

import { ExpenseShortcutPayload } from 'shared/expense';
import { getShortcutById, sortShortcutDownById, sortShortcutUpById } from 'server/data/ShortcutDb';
import {
  deleteShortcut,
  deleteShortcutIcon,
  updateShortcutData,
  uploadShortcutIcon,
} from 'server/data/ShortcutService';
import { processFileUpload } from 'server/server/FileHandling';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates shortcut API router.
 * Assumed attach path: `/api/profile/shortcut`
 */
export function createShortcutApi() {
  const api = createValidatingRouter(Router());

  // GET /api/profile/shortcut/:id
  api.getTx('/:id', {}, (tx, session, { params }) =>
    getShortcutById(tx, session.group.id, session.user.id, params.id),
  );

  // PUT /api/profile/shortcut/:id
  api.putTx('/:id', { body: ExpenseShortcutPayload }, (tx, session, { params, body }) =>
    updateShortcutData(tx, session.group.id, session.user.id, params.id, body),
  );

  // DELETE /api/profile/shortcut/:id
  api.deleteTx('/:id', {}, (tx, session, { params }) =>
    deleteShortcut(tx, session.group.id, session.user.id, params.id),
  );

  // POST /api/profile/shortcut/:id/sort/up
  api.postTx('/:id/sort/up', {}, (tx, session, { params }) =>
    sortShortcutUpById(tx, session.group.id, session.user.id, params.id),
  );

  // POST /api/profile/shortcut/:id/sort/down
  api.postTx('/:id/sort/down', {}, (tx, session, { params }) =>
    sortShortcutDownById(tx, session.group.id, session.user.id, params.id),
  );

  // POST /api/profile/shortcut/:shortcutId/icon/:filename
  api.postTx(
    '/:id/icon/:filename/margin/:margin',
    {},
    processFileUpload('filename', (tx, session, file, { params }) =>
      uploadShortcutIcon(tx, session.group.id, session.user.id, params.id, file, params.margin),
    ),
  );

  // DELETE /api/profile/shortcut/:id/icon
  api.deleteTx('/:id/icon', {}, (tx, session, { params }) =>
    deleteShortcutIcon(tx, session.group.id, session.user.id, params.id),
  );

  return api.router;
}
