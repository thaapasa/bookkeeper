import crypto from 'crypto';
import debug from 'debug';
import { IBaseProtocol } from 'pg-promise';
import { promisify } from 'util';

import { ApiMessage } from 'shared/types/Api';
import { AuthenticationError } from 'shared/types/Errors';
import { Session, SessionBasicInfo } from 'shared/types/Session';

import { config } from '../Config';
import { CategoriesDb } from './CategoriesDb';
import { db } from './Db';
import sources from './Sources';
import users, { mapUser, RawUserData } from './Users';

const log = debug('bookkeeper:api:sessions');

const randomBytes = promisify(crypto.randomBytes);

const tokenSelect = `
SELECT
  s.token, s.refresh_token as "refreshToken", s.user_id as id, s.login_time as "loginTime",
  u.username, u.email, u.first_name as "firstName", u.last_name as "lastName", u.image,
  u.default_group_id as "defaultGroupId", u.expense_shortcuts as "expenseShortcuts",
  g.id AS "groupId", g.name as "groupName",
  go.default_source_id as "defaultSourceId"
FROM sessions s
  INNER JOIN users u ON (s.user_id = u.id)
  LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($/groupId/, u.default_group_id))
  LEFT JOIN groups g ON (g.id = go.group_id) `;

async function createToken(): Promise<string> {
  const buf = await randomBytes(20);
  return buf.toString('hex');
}

function purgeExpiredSessions(tx: IBaseProtocol<any>) {
  return (): Promise<null> =>
    tx.none('DELETE FROM sessions WHERE expiry_time <= NOW()');
}

function createSession(tx: IBaseProtocol<any>) {
  return async (user: RawUserData): Promise<string[]> => {
    const tokens = await Promise.all([createToken(), createToken()]);
    log('User', user.email, 'logged in with token', tokens[0]);
    await tx.none(
      `
INSERT INTO sessions (token, refresh_token, user_id, login_time, expiry_time)
VALUES
  ($/token/, $/refreshToken/, $/userId/, NOW(), NOW() + $/sessionTimeout/::INTERVAL),
  ($/refreshToken/, NULL, $/userId/, NOW(), NOW() + $/refreshTokenTimeout/::INTERVAL)`,
      {
        token: tokens[0],
        refreshToken: tokens[1],
        userId: user.id,
        sessionTimeout: config.sessionTimeout,
        refreshTokenTimeout: config.refreshTokenTimeout,
      }
    );
    return tokens;
  };
}

function createSessionInfo(
  [token, refreshToken]: string[],
  userData: RawUserData,
  loginTime?: Date
): SessionBasicInfo {
  return {
    token,
    refreshToken,
    user: mapUser({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      defaultGroupId: userData.defaultGroupId,
      expenseShortcuts: userData.expenseShortcuts,
    }),
    group: {
      id: userData.groupId,
      name: userData.groupName,
      defaultSourceId: userData.defaultSourceId,
    },
    loginTime,
  };
}

function appendInfo(tx: IBaseProtocol<any>) {
  return (session: SessionBasicInfo): Promise<Session> =>
    Promise.all([
      users.tx.getGroups(tx)(session.user.id),
      sources.tx.getAll(tx)(session.group.id),
      CategoriesDb.getAll(tx, session.group.id),
      users.tx.getAll(tx)(session.group.id),
    ]).then(a => ({
      groups: a[0],
      sources: a[1],
      categories: a[2],
      users: a[3],
      ...session,
    }));
}

function login(
  username: string,
  password: string,
  groupId?: number
): Promise<Session> {
  log('Login for', username);
  return db.tx(async tx => {
    const user = await users.tx.getByCredentials(tx)(
      username,
      password,
      groupId
    );
    const tokens = await createSession(tx)(user);
    const sessionInfo = createSessionInfo(tokens, user);
    return appendInfo(tx)(sessionInfo);
  });
}

function getUserInfoByRefreshToken(tx: IBaseProtocol<any>) {
  return async (token: string, groupId?: number): Promise<RawUserData> => {
    await purgeExpiredSessions(tx)();
    const userData = await tx.oneOrNone<RawUserData>(
      tokenSelect +
        'WHERE s.token=$/token/ AND s.refresh_token IS NULL AND s.expiry_time > NOW()',
      { token, groupId }
    );
    if (!userData) {
      throw new AuthenticationError(
        'INVALID_TOKEN',
        'Refresh token is invalid',
        token
      );
    }
    await tx.none(
      `DELETE FROM sessions WHERE refresh_token=$/token/ OR token=$/token/`,
      { token }
    );
    return userData;
  };
}
function refresh(refreshToken: string, groupId?: number): Promise<Session> {
  log('Refreshing session with', refreshToken);
  return db.tx(async tx => {
    const user = await getUserInfoByRefreshToken(tx)(refreshToken, groupId);
    const tokens = await createSession(tx)(user);
    const sessionInfo = createSessionInfo(tokens, user);
    return appendInfo(tx)(sessionInfo);
  });
}

function logout(tx: IBaseProtocol<any>) {
  return async (session: SessionBasicInfo): Promise<ApiMessage> => {
    log('Logout for', session.token);
    if (!session.token) {
      throw new AuthenticationError(
        'INVALID_TOKEN',
        'Session token is missing'
      );
    }
    await tx.none(
      `
DELETE FROM sessions
WHERE (token=$/token/ AND refresh_token IS NOT NULL)
  OR (token=$/refreshToken/ AND refresh_token IS NULL)`,
      { token: session.token, refreshToken: session.refreshToken }
    );
    return {
      status: 'OK',
      message: 'User has logged out',
      userId: session.user.id,
    };
  };
}

function getSession(tx: IBaseProtocol<any>) {
  return async (token: string, groupId?: number): Promise<SessionBasicInfo> => {
    await purgeExpiredSessions(tx)();
    const userData = await tx.oneOrNone<RawUserData>(
      tokenSelect +
        'WHERE s.token=$/token/ AND s.refresh_token IS NOT NULL AND s.expiry_time > NOW()',
      { token, groupId }
    );
    if (!userData) {
      throw new AuthenticationError(
        'INVALID_TOKEN',
        'Access token is invalid',
        token
      );
    }
    await tx.none(
      `
UPDATE sessions
SET expiry_time=NOW() + $/sessionTimeout/::INTERVAL
WHERE token=$/token/`,
      { token, sessionTimeout: config.sessionTimeout }
    );
    return createSessionInfo(
      [userData.token, userData.refreshToken],
      userData,
      userData.loginTime
    );
  };
}

export default {
  login,
  refresh,
  logout: logout(db),
  appendInfo: (session: SessionBasicInfo): Promise<Session> =>
    db.tx(tx => appendInfo(tx)(session)),
  tx: {
    getSession,
    appendInfo,
  },
};
