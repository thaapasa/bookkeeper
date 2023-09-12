import * as B from 'baconjs';

import { Group, Session, Source, User } from 'shared/types';
import { toMap } from 'shared/util';
import { logger } from 'client/Logger';

import apiConnect from './ApiConnect';

const loginBus = new B.Bus<Session | null>();
const sessionBus = new B.Bus<Session | null>();

export const sessionP = sessionBus.toProperty(null);
export const validSessionE: B.EventStream<Session> = sessionP.filter(s => s !== null) as any;
export const userMapE: B.EventStream<Record<string, User>> = validSessionE.map(s =>
  toMap(s.users, 'id'),
);
export const sourceMapE: B.EventStream<Record<string, Source>> = validSessionE.map(s =>
  toMap(s.sources, 'id'),
);

const refreshTokenKey = 'refreshToken';

export function getTitle(group?: Group): string {
  const groupName = group ? group.name : undefined;
  const title = groupName ? `Kukkaro - ${groupName}` : 'Kukkaro';
  return title;
}

function clearLoginData(clearRefreshToken: boolean) {
  logger.info('Clearing login data');
  document.title = getTitle();
  sessionBus.push(null);
  apiConnect.setToken(null);
  if (clearRefreshToken) {
    localStorage.removeItem(refreshTokenKey);
  }
}

async function getLoginFromLocalStorage(): Promise<Session | null> {
  const token = localStorage.getItem(refreshTokenKey);
  if (!token) {
    logger.info('No token present, not logged in');
    apiConnect.setToken(null);
    return null;
  }
  logger.info(`Not logged in but refresh token exists in localStorage: ${token}`);
  try {
    apiConnect.setToken(null);
    return await apiConnect.refreshSession(token);
  } catch (e) {
    logger.warn(e, 'Token refresh failed');
    apiConnect.setToken(null);
    return null;
  }
}

loginBus.onValue(session => {
  logger.info({ session }, 'Current session is');
  if (!session) {
    clearLoginData(false);
    return;
  }
  if (session?.refreshToken) {
    localStorage.setItem(refreshTokenKey, session.refreshToken);
  } else {
    localStorage.removeItem(refreshTokenKey);
  }
  document.title = getTitle(session.group);
  apiConnect.setToken(session.token);
  sessionBus.push(session);
});

export async function checkLoginState(): Promise<boolean> {
  const session = await getLoginFromLocalStorage();
  loginBus.push(session);
  return session != null;
}

export async function login(username: string, password: string): Promise<void> {
  logger.info(`Logging in as: ${username}`);
  try {
    const session = await apiConnect.login(username, password);
    loginBus.push(session);
    return;
  } catch (e) {
    logger.info(e, 'Error when logging in');
    clearLoginData(true);
    throw e;
  }
}

export async function updateSession(): Promise<boolean> {
  try {
    logger.info('Updating session data...');
    const session = await apiConnect.getSession();
    if (!session) {
      logger.info('Session not valid anymore, not updating');
      return false;
    }
    loginBus.push(session);
    logger.info('Session data updated');
    return true;
  } catch (e) {
    logger.warn(e, 'Error in session update');
    return false;
  }
}

export async function logout() {
  logger.info('Logging out');
  try {
    await apiConnect.logout();
  } catch (e) {
    logger.warn(e, 'Error when logging out');
  }
  clearLoginData(true);
}
