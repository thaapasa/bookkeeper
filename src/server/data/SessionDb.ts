import crypto from 'crypto';
import { ITask } from 'pg-promise';
import { promisify } from 'util';

import { ApiMessage, AuthenticationError, Session, SessionBasicInfo } from 'shared/types';
import { logger } from 'server/Logger';

import { config } from '../Config';
import { getAllCategories } from './CategoryDb';
import { getAllSources } from './SourceDb';
import {
  dbRowToUser,
  getAllUsers,
  getGroupsForUser,
  getUserByCredentials,
  RawUserData,
} from './UserDb';

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

async function createSession(tx: ITask<any>, user: RawUserData): Promise<string[]> {
  const tokens = await Promise.all([createToken(), createToken()]);
  logger.info(`User ${user.email} logged in with token ${tokens[0]}`);
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
    },
  );
  return tokens;
}

function createSessionInfo(
  [token, refreshToken]: string[],
  userData: RawUserData,
  loginTime?: Date,
): SessionBasicInfo {
  return {
    token,
    refreshToken,
    user: dbRowToUser({
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

export async function appendInfoToSession(
  tx: ITask<any>,
  session: SessionBasicInfo,
): Promise<Session> {
  const [groups, sources, categories, users] = await Promise.all([
    getGroupsForUser(tx, session.user.id),
    getAllSources(tx, session.group.id),
    getAllCategories(tx, session.group.id),
    getAllUsers(tx, session.group.id),
  ]);
  return { ...session, groups, sources, categories, users };
}

export async function loginUserWithCredentials(
  tx: ITask<any>,
  username: string,
  password: string,
  groupId?: number,
): Promise<Session> {
  logger.info('Login for %s', username);
  const user = await getUserByCredentials(tx, username, password, groupId);
  const tokens = await createSession(tx, user);
  const sessionInfo = createSessionInfo(tokens, user);
  return appendInfoToSession(tx, sessionInfo);
}

async function getUserInfoByRefreshToken(
  tx: ITask<any>,
  token: string,
  groupId?: number,
): Promise<RawUserData> {
  await purgeExpiredSessions(tx);
  const userData = await tx.oneOrNone<RawUserData>(
    tokenSelect + 'WHERE s.token=$/token/ AND s.refresh_token IS NULL AND s.expiry_time > NOW()',
    { token, groupId },
  );
  if (!userData) {
    throw new AuthenticationError('INVALID_TOKEN', 'Refresh token is invalid', token);
  }
  await tx.none(`DELETE FROM sessions WHERE refresh_token=$/token/ OR token=$/token/`, { token });
  return userData;
}

export async function refreshSessionWithRefreshToken(
  tx: ITask<any>,
  refreshToken: string,
  groupId?: number,
): Promise<Session> {
  logger.info('Refreshing session with %s', refreshToken);
  const user = await getUserInfoByRefreshToken(tx, refreshToken, groupId);
  const tokens = await createSession(tx, user);
  const sessionInfo = createSessionInfo(tokens, user);
  return appendInfoToSession(tx, sessionInfo);
}

export async function logoutSession(
  tx: ITask<any>,
  session: SessionBasicInfo,
): Promise<ApiMessage> {
  logger.info('Logout for %s', session.token);
  if (!session.token) {
    throw new AuthenticationError('INVALID_TOKEN', 'Session token is missing');
  }
  await tx.none(
    `DELETE FROM sessions
      WHERE (token=$/token/ AND refresh_token IS NOT NULL)
        OR (token=$/refreshToken/ AND refresh_token IS NULL)`,
    { token: session.token, refreshToken: session.refreshToken },
  );
  return {
    status: 'OK',
    message: 'User has logged out',
    userId: session.user.id,
  };
}

export async function getSessionByToken(
  tx: ITask<any>,
  token: string,
  groupId?: number,
): Promise<SessionBasicInfo> {
  await purgeExpiredSessions(tx);
  const userData = await tx.oneOrNone<RawUserData>(
    tokenSelect +
      'WHERE s.token=$/token/ AND s.refresh_token IS NOT NULL AND s.expiry_time > NOW()',
    { token, groupId },
  );
  if (!userData) {
    throw new AuthenticationError('INVALID_TOKEN', 'Access token is invalid', token);
  }
  await tx.none(
    `UPDATE sessions
        SET expiry_time=NOW() + $/sessionTimeout/::INTERVAL
        WHERE token=$/token/`,
    { token, sessionTimeout: config.sessionTimeout },
  );
  return createSessionInfo([userData.token, userData.refreshToken], userData, userData.loginTime);
}
