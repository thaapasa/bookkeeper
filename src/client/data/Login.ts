import * as B from 'baconjs';
import { Session, Group, User, Source } from 'shared/types/Session';
import apiConnect from './ApiConnect';
import { toMap } from 'shared/util/Arrays';
import debug from 'debug';
const log = debug('bookkeeper:login');

const loginBus = new B.Bus<Session | null>();
const sessionBus = new B.Bus<Session | null>();

export const sessionP = sessionBus.toProperty(null);
export const validSessionE: B.EventStream<Session> = sessionP.filter(
  s => s !== null
) as any;
export const userMapE: B.EventStream<Record<string, User>> = validSessionE.map(
  s => toMap(s.users, 'id')
);
export const sourceMapE: B.EventStream<Record<string, Source>> =
  validSessionE.map(s => toMap(s.sources, 'id'));

const refreshTokenKey = 'refreshToken';

export function getTitle(group?: Group): string {
  const groupName = group ? group.name : undefined;
  const title = groupName ? `Kukkaro - ${groupName}` : 'Kukkaro';
  return title;
}

function clearLoginData(clearRefreshToken: boolean) {
  log('Clearing login data');
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
    log('No token present, not logged in');
    apiConnect.setToken(null);
    return null;
  }
  log('Not logged in but refresh token exists in localStorage', token);
  try {
    apiConnect.setToken(token);
    return await apiConnect.refreshSession();
  } catch (e) {
    log('Token refresh failed');
    apiConnect.setToken(null);
    return null;
  }
}

loginBus.onValue(session => {
  log('Current session is', session);
  if (!session) {
    clearLoginData(false);
    return;
  }
  if (session && session.refreshToken) {
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
  log('Logging in as', username);
  try {
    const session = await apiConnect.login(username, password);
    loginBus.push(session);
    return;
  } catch (e) {
    log('Error when logging in', e);
    clearLoginData(true);
    throw e;
  }
}

export async function updateSession(): Promise<boolean> {
  try {
    log('Updating session data...');
    const session = await apiConnect.getSession();
    if (!session) {
      log('Session not valid anymore, not updating');
      return false;
    }
    loginBus.push(session);
    log('Session data updated');
    return true;
  } catch (e) {
    log('Error in session update:', e);
    return false;
  }
}

export async function logout() {
  log('Logging out');
  try {
    await apiConnect.logout();
  } catch (e) {
    log('Error when logging out', e);
  }
  clearLoginData(true);
}
