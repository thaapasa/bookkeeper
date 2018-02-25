import * as B from 'baconjs';
import { Session, Group, User, Source } from '../../shared/types/Session';
import apiConnect from './ApiConnect';
import { Map } from '../../shared/util/Objects';
import { toMap } from '../../shared/util/Arrays';
const debug = require('debug')('bookkeeper:login');

const loginBus = new B.Bus<any, Session | null>();
const sessionBus = new B.Bus<any, Session | null>();

export const sessionP = sessionBus.toProperty(null);
export const validSessionE: B.EventStream<any, Session> = sessionP.filter(s => s !== null) as any;
export const userMapE: B.EventStream<any, Map<User>> = validSessionE.map(s => toMap(s.users, 'id'));
export const sourceMapE: B.EventStream<any, Map<Source>> = validSessionE.map(s => toMap(s.sources, 'id'));

const refreshTokenKey = 'refreshToken';

export function getTitle(group?: Group) {
  const groupName = group ? group.name : undefined;
  const title = groupName ? `Kukkaro - ${groupName}` : 'Kukkaro';
  return title;
}

function clearLoginData(clearRefreshToken: boolean) {
  debug('Clearing login data');
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
    debug('No token present, not logged in');
    apiConnect.setToken(null);
    return null;
  }
  debug('Not logged in but refresh token exists in localStorage', token);
  try {
    apiConnect.setToken(token);
    return await apiConnect.refreshSession();
  } catch (e) {
    debug('Token refresh failed');
    apiConnect.setToken(null);
    return null;
  }
}

loginBus.onValue(session => {
  debug('Current session is', session);
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
  debug('Logging in as', username);
  try {
    const session = await apiConnect.login(username, password);
    loginBus.push(session);
    return;
  } catch (e) {
    debug('Error when logging in', e);
    clearLoginData(true);
    throw e;
  }
}

export async function updateSession(): Promise<boolean> {
  try {
    debug('Updating session data...');
    const session = await apiConnect.getSession();
    if (!session) {
      debug('Session not valid anymore, not updating');
      return false;
    }
    loginBus.push(session);
    debug('Session data updated');
    return true;
  } catch (e) {
    debug('Error in session update:', e);
    return false;
  }
}

export async function logout() {
  debug('Logging out');
  try {
    await apiConnect.logout();
  } catch (e) {
    debug('Error when logging out', e);
  }
  clearLoginData(true);
}
