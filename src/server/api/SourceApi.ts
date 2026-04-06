import { Router } from 'express';
import { z } from 'zod';

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
  api.getTx('/list', { response: z.array(Source), groupRequired: true }, (tx, session) =>
    getAllSources(tx, session.group.id),
  );

  // GET /api/source/:id
  api.getTx('/:sourceId', { response: Source, groupRequired: true }, (tx, session, { params }) =>
    getSourceById(tx, session.group.id, params.sourceId),
  );

  api.patchTx(
    '/:sourceId',
    { body: SourcePatch, response: Source },
    (tx, session, { params, body }) => updateSource(tx, session.group.id, params.sourceId, body),
  );

  return api.router;
}
