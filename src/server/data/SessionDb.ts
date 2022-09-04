import crypto from 'crypto';
import debug from 'debug';
import { ITask } from 'pg-promise';
import { promisify } from 'util';

import { ApiMessage } from 'shared/types/Api';
import { AuthenticationError } from 'shared/types/Errors';
import { Session, SessionBasicInfo } from 'shared/types/Session';

import { config } from '../Config';
import { CategoryDb } from './CategoryDb';
import { SourceDb } from './SourceDb';
import { RawUserData, UserDb } from './UserDb';

const log = debug('bookkeeper:api:sessions');

const randomBytes = promisify(crypto.randomBytes);

const tokenSelect = `--sql
SELECT
  s.token, s.refresh_token as "refreshToken", s.user_id as id, s.login_time as "loginTime",
  u.username, u.email, u.first_name as "firstName", u.last_name as "lastName", u.image,
  u.default_group_id as "defaultGroupId", u.expense_shortcuts as "expenseShortcuts",
  g.id AS "groupId", g.name as "groupName",
  go.default_source_id as "defaultSourceId"
FROM sessions s
  INNER JOIN users u ON (s.user_id = u.id)
  LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($/groupId/, u.default_group_id))
  LEFT JOIN groups g ON (g.id = go.group_id)`;

async function createToken(): Promise<string> {
  const buf = await randomBytes(20);
  return buf.toString('hex');
}

async function purgeExpiredSessions(tx: ITask<any>) {
  await tx.none('DELETE FROM sessions WHERE expiry_time <= NOW()');
}

async function createSession(
  tx: ITask<any>,
  user: RawUserData
): Promise<string[]> {
  const tokens = await Promise.all([createToken(), createToken()]);
  log('User', user.email, 'logged in with token', tokens[0]);
  await tx.none(
    `INSERT INTO sessions (token, refresh_token, user_id, login_time, expiry_time)
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
}

function createSessionInfo(
  [token, refreshToken]: string[],
  userData: RawUserData,
  loginTime?: Date
): SessionBasicInfo {
  return {
    token,
    refreshToken,
    user: UserDb.mapUser({
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

async function appendInfo(
  tx: ITask<any>,
  session: SessionBasicInfo
): Promise<Session> {
  const [groups, sources, categories, users] = await Promise.all([
    UserDb.getGroups(tx, session.user.id),
    SourceDb.getAll(tx, session.group.id),
    CategoryDb.getAll(tx, session.group.id),
    UserDb.getAll(tx, session.group.id),
  ]);
  return { ...session, groups, sources, categories, users };
}

async function login(
  tx: ITask<any>,
  username: string,
  password: string,
  groupId?: number
): Promise<Session> {
  log('Login for', username);
  const user = await UserDb.getByCredentials(tx, username, password, groupId);
  const tokens = await createSession(tx, user);
  const sessionInfo = createSessionInfo(tokens, user);
  return appendInfo(tx, sessionInfo);
}

async function getUserInfoByRefreshToken(
  tx: ITask<any>,
  token: string,
  groupId?: number
): Promise<RawUserData> {
  await purgeExpiredSessions(tx);
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
}

async function refresh(
  tx: ITask<any>,
  refreshToken: string,
  groupId?: number
): Promise<Session> {
  log('Refreshing session with', refreshToken);
  const user = await getUserInfoByRefreshToken(tx, refreshToken, groupId);
  const tokens = await createSession(tx, user);
  const sessionInfo = createSessionInfo(tokens, user);
  return appendInfo(tx, sessionInfo);
}

async function logout(
  tx: ITask<any>,
  session: SessionBasicInfo
): Promise<ApiMessage> {
  log('Logout for', session.token);
  if (!session.token) {
    throw new AuthenticationError('INVALID_TOKEN', 'Session token is missing');
  }
  await tx.none(
    `DELETE FROM sessions
      WHERE (token=$/token/ AND refresh_token IS NOT NULL)
        OR (token=$/refreshToken/ AND refresh_token IS NULL)`,
    { token: session.token, refreshToken: session.refreshToken }
  );
  return {
    status: 'OK',
    message: 'User has logged out',
    userId: session.user.id,
  };
}

async function getSession(
  tx: ITask<any>,
  token: string,
  groupId?: number
): Promise<SessionBasicInfo> {
  await purgeExpiredSessions(tx);
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
    `UPDATE sessions
        SET expiry_time=NOW() + $/sessionTimeout/::INTERVAL
        WHERE token=$/token/`,
    { token, sessionTimeout: config.sessionTimeout }
  );
  return createSessionInfo(
    [userData.token, userData.refreshToken],
    userData,
    userData.loginTime
  );
}

export const SessionDb = {
  login,
  refresh,
  logout,
  appendInfo,
  getSession,
};
