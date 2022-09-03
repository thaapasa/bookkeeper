import { Router } from 'express';

import { ApiMessage } from 'shared/types/Api';
import { Group, Session, SessionBasicInfo } from 'shared/types/Session';
import { optNumber } from 'shared/util/Util';
import { SessionDb } from 'server/data/SessionDb';
import { UserDb } from 'server/data/UserDb';

import * as server from '../util/ServerUtil';

/**
 * Creates session API router.
 * Assumed attach path: `/api/session`
 */
export function createSessionApi() {
  const api = Router();

  // PUT /api/session
  api.put(
    '/',
    server.processUnauthorizedTxRequest(
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
    server.processUnauthorizedTxRequest(
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
    server.processTxRequest(
      (tx, session): Promise<Session> => SessionDb.appendInfo(tx, session)
    )
  );

  // GET /api/session/bare
  api.get(
    '/bare',
    server.processRequest(async (session): Promise<SessionBasicInfo> => session)
  );

  // DELETE /api/session
  api.delete(
    '/',
    server.processTxRequest(
      (tx, session): Promise<ApiMessage> => SessionDb.logout(tx, session)
    )
  );

  // GET /api/session/groups
  api.get(
    '/groups',
    server.processTxRequest(
      (tx, session): Promise<Group[]> => UserDb.getGroups(tx, session.user.id)
    )
  );

  return api;
}
