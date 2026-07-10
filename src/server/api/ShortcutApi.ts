import { Router } from 'express';
import { z } from 'zod';

import { ExpenseShortcutPayload } from 'shared/expense';
import { IntString } from 'shared/types';
import { getShortcutById, sortShortcutDownById, sortShortcutUpById } from 'server/data/ShortcutDb';
import {
  createShortcut,
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

  // POST /api/profile/shortcut
  api.postTx('/', { body: ExpenseShortcutPayload, groupRequired: true }, (tx, session, { body }) =>
    createShortcut(tx, session.group.id, session.user.id, body),
  );

  // GET /api/profile/shortcut/:id
  api.getTx('/:id', { groupRequired: true }, (tx, session, { params }) =>
    getShortcutById(tx, session.group.id, session.user.id, params.id),
  );

  // PUT /api/profile/shortcut/:id
  api.putTx(
    '/:id',
    { body: ExpenseShortcutPayload, groupRequired: true },
    (tx, session, { params, body }) =>
      updateShortcutData(tx, session.group.id, session.user.id, params.id, body),
  );

  // DELETE /api/profile/shortcut/:id
  api.deleteTx('/:id', { groupRequired: true }, (tx, session, { params }) =>
    deleteShortcut(tx, session.group.id, session.user.id, params.id),
  );

  // POST /api/profile/shortcut/:id/sort/up
  api.postTx('/:id/sort/up', { groupRequired: true }, (tx, session, { params }) =>
    sortShortcutUpById(tx, session.group.id, session.user.id, params.id),
  );

  // POST /api/profile/shortcut/:id/sort/down
  api.postTx('/:id/sort/down', { groupRequired: true }, (tx, session, { params }) =>
    sortShortcutDownById(tx, session.group.id, session.user.id, params.id),
  );

  const MarginQuery = z.object({ margin: IntString.refine(n => n >= 0).optional() });

  // POST /api/profile/shortcut/:shortcutId/icon
  api.postTx(
    '/:id/icon',
    { query: MarginQuery, groupRequired: true },
    processFileUpload((tx, session, file, { params, query }) =>
      uploadShortcutIcon(tx, session.group.id, session.user.id, params.id, file, query.margin ?? 0),
    ),
  );

  // DELETE /api/profile/shortcut/:id/icon
  api.deleteTx('/:id/icon', { groupRequired: true }, (tx, session, { params }) =>
    deleteShortcutIcon(tx, session.group.id, session.user.id, params.id),
  );

  return api.router;
}
