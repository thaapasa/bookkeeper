import { Router } from 'express';

import { Source } from 'shared/types/Session';
import { SourcePatch } from 'shared/types/Source';
import { SourceDb } from 'server/data/SourceDb';
import { Requests } from 'server/server/RequestHandling';

import { IdParamType } from './Validations';

/**
 * Creates source API router.
 * Assumed attach path: `/api/source`
 */
export function createSourceApi() {
  const api = Router();

  // GET /api/source/list
  api.get(
    '/list',
    Requests.txRequest(
      (tx, session): Promise<Source[]> => SourceDb.getAll(tx, session.group.id),
      true
    )
  );

  // GET /api/source/:id
  api.get(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdParamType },
      (tx, session, { params }): Promise<Source> =>
        SourceDb.getById(tx, session.group.id, params.id),
      true
    )
  );

  api.patch(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdParamType, body: SourcePatch },
      (tx, session, { params, body }) =>
        SourceDb.update(tx, session.group.id, params.id, body)
    )
  );

  return api;
}
