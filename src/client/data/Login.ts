import * as B from 'baconjs';

import { Group, Session, Source, User } from 'shared/types';
import { toMap } from 'shared/util';
import { logger } from 'client/Logger';

import apiConnect, { TokenKey } from './ApiConnect';

const loginBus = new B.Bus<Session | null>();
const sessionBus = new B.Bus<Session | null>();

export const sessionP = sessionBus.toProperty(null);
export const validSessionP: B.Property<Session> = sessionP.filter((s): s is Session => s !== null);
export const userMapP: B.Property<Record<string, User>> = validSessionP.map(s =>
  toMap(s.users, 'id'),
);
export const sourceMapP: B.Property<Record<string, Source>> = validSessionP.map(s =>
  toMap(s.sources, 'id'),
);

const refreshTokenKey = 'refreshToken';

/**
 * Holds the in-flight session refresh promise to deduplicate concurrent refresh requests.
 * Multiple 401 responses arriving simultaneously will share this single refresh attempt
 * rather than each triggering their own refresh.
 */
let refreshPromise: Promise<boolean> | null = null;

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
  const token = localStorage.getItem(TokenKey);
  if (token) {
    apiConnect.setToken(token);
    try {
      const session = await apiConnect.getSession();
      if (session) {
        logger.info('Current token is still valid, using it...');
        return session;
      }
    } catch (e) {
      logger.info(e, 'Existing token is not valid');
    }
  }

  // Try to use refresh token
  const refreshToken = localStorage.getItem(refreshTokenKey);
  if (!refreshToken) {
    logger.info('No refresh token present, not logged in');
    apiConnect.setToken(null);
    return null;
  }
  logger.info(`Not logged in but refresh token exists in localStorage: ${refreshToken}`);
  try {
    apiConnect.setToken(null);
    return await apiConnect.refreshSession(refreshToken);
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

/**
 * Checks login state and refreshes session if needed.
 * Deduplicates concurrent calls - if a refresh is already in progress,
 * subsequent calls will share the same promise.
 */
export async function checkLoginState(): Promise<boolean> {
  if (refreshPromise) {
    logger.info('Session refresh already in progress, waiting for it');
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const session = await getLoginFromLocalStorage();
      loginBus.push(session);
      return session != null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
