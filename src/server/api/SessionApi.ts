import { Router } from 'express';

import { ApiMessage } from 'shared/types/Api';
import { Group, Session, SessionBasicInfo } from 'shared/types/Session';
import { optNumber } from 'shared/util';
import { SessionDb } from 'server/data/SessionDb';
import { UserDb } from 'server/data/UserDb';
import { Requests } from 'server/server/RequestHandling';

import * as server from '../server/ServerUtil';

/**
 * Creates session API router.
 * Assumed attach path: `/api/session`
 */
export function createSessionApi() {
  const api = Router();

  // PUT /api/session
  api.put(
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
  api.put(
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
  api.get(
    '/',
    Requests.txRequest(
      (tx, session): Promise<Session> => SessionDb.appendInfo(tx, session)
    )
  );

  // GET /api/session/bare
  api.get(
    '/bare',
    Requests.request(async (session): Promise<SessionBasicInfo> => session)
  );

  // DELETE /api/session
  api.delete(
    '/',
    Requests.txRequest(
      (tx, session): Promise<ApiMessage> => SessionDb.logout(tx, session)
    )
  );

  // GET /api/session/groups
  api.get(
    '/groups',
    Requests.txRequest(
      (tx, session): Promise<Group[]> => UserDb.getGroups(tx, session.user.id)
    )
  );

  return api;
}
