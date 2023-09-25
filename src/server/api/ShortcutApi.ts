import { Router } from 'express';

import { ExpenseShortcutPayload } from 'shared/expense';
import { deleteShortcutById, getShortcutById, updateShortcutData } from 'server/data/ShortcutDb';
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
    deleteShortcutById(tx, session.group.id, session.user.id, params.id),
  );

  return api.router;
}
