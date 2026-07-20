import { Router } from 'express';
import { z } from 'zod';

import { Source, SourcePatch, SourceUserCardsUpdate } from 'shared/types';
import {
  getAllSources,
  getSourceById,
  updateSource,
  updateSourceUserCards,
} from 'server/data/SourceDb';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates source API router.
 * Assumed attach path: `/api/source`
 */
export function createSourceApi() {
  const api = createValidatingRouter(Router());

  // GET /api/source/list
  api.getTx('/list', { response: z.array(Source), groupRequired: true }, (tx, session) =>
    getAllSources(tx, session.group.id),
  );

  // GET /api/source/:id
  api.getTx('/:sourceId', { response: Source, groupRequired: true }, (tx, session, { params }) =>
    getSourceById(tx, session.group.id, params.sourceId),
  );

  api.patchTx(
    '/:sourceId',
    { body: SourcePatch, response: Source, groupRequired: true },
    (tx, session, { params, body }) => updateSource(tx, session.group.id, params.sourceId, body),
  );

  // PATCH /api/source/:sourceId/user/:userId
  api.patchTx(
    '/:sourceId/user/:userId',
    { body: SourceUserCardsUpdate, response: Source, groupRequired: true },
    (tx, session, { params, body }) =>
      updateSourceUserCards(tx, session.group.id, params.sourceId, params.userId, body.cards),
  );

  return api.router;
}
