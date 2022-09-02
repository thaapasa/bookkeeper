import { Router } from 'express';

import { ApiMessage } from 'shared/types/Api';
import { Group, Session, SessionBasicInfo } from 'shared/types/Session';
import { optNumber } from 'shared/util/Util';

import sessions from '../data/Sessions';
import users from '../data/Users';
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
    server.processUnauthorizedRequest(
      (req): Promise<Session> =>
        sessions.login(
          req.body.username,
          req.body.password,
          optNumber(req.query.groupId)
        )
    )
  );

  // PUT /api/session/refresh
  api.put(
    '/refresh',
    server.processUnauthorizedRequest(
      (req): Promise<Session> =>
        sessions.refresh(server.getToken(req), optNumber(req.query.groupId))
    )
  );

  // GET /api/session
  api.get(
    '/',
    server.processRequest(
      (session): Promise<Session> => sessions.appendInfo(session)
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
    server.processRequest(
      (session): Promise<ApiMessage> => sessions.logout(session)
    )
  );

  // GET /api/session/groups
  api.get(
    '/groups',
    server.processRequest(
      (session): Promise<Group[]> => users.getGroups(session.user.id)
    )
  );

  return api;
}
