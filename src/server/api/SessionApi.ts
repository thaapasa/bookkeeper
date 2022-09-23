import { Router } from 'express';

import { ApiMessage, Group, Session } from 'shared/types';
import { optNumber } from 'shared/util';
import { SessionDb } from 'server/data/SessionDb';
import { UserDb } from 'server/data/UserDb';
import { Requests } from 'server/server/RequestHandling';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

import * as server from '../server/ServerUtil';

/**
 * Creates session API router.
 * Assumed attach path: `/api/session`
 */
export function createSessionApi() {
  const api = createValidatingRouter(Router());

  // PUT /api/session
  api.router.put(
    '/',
    Requests.unauthorizedTxRequest(
      (tx, req): Promise<Session> =>
        SessionDb.login(
          tx,
          req.body.username,
          req.body.password,
          optNumber(req.query.groupId)
        )
    )
  );

  // PUT /api/session/refresh
  api.router.put(
    '/refresh',
    Requests.unauthorizedTxRequest(
      (tx, req): Promise<Session> =>
        SessionDb.refresh(
          tx,
          server.getToken(req),
          optNumber(req.query.groupId)
        )
    )
  );

  // GET /api/session
  api.getTx(
    '/',
    {},
    (tx, session): Promise<Session> => SessionDb.appendInfo(tx, session)
  );

  // GET /api/session/bare
  api.get('/bare', {}, session => session);

  // DELETE /api/session
  api.deleteTx(
    '/',
    {},
    (tx, session): Promise<ApiMessage> => SessionDb.logout(tx, session)
  );

  // GET /api/session/groups
  api.getTx(
    '/groups',
    {},
    (tx, session): Promise<Group[]> => UserDb.getGroups(tx, session.user.id)
  );

  return api.router;
}
