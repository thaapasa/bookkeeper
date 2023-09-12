import { Router } from 'express';

import { Source, SourcePatch } from 'shared/types';
import { getAllSources, getSourceById, updateSource } from 'server/data/SourceDb';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates source API router.
 * Assumed attach path: `/api/source`
 */
export function createSourceApi() {
  const api = createValidatingRouter(Router());

  // GET /api/source/list
  api.getTx('/list', {}, (tx, session): Promise<Source[]> => getAllSources(tx, session.group.id), true);

  // GET /api/source/:id
  api.getTx(
    '/:sourceId',
    {},
    (tx, session, { params }): Promise<Source> => getSourceById(tx, session.group.id, params.sourceId),
    true,
  );

  api.patchTx('/:sourceId', { body: SourcePatch }, (tx, session, { params, body }) =>
    updateSource(tx, session.group.id, params.sourceId, body),
  );

  return api.router;
}
