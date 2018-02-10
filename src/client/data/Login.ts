import * as B from 'baconjs';
import * as state from './State';
import { Session, Group, User, Source } from '../../shared/types/Session';
const debug = require('debug')('bookkeeper:login');

interface LoginCredentials {
  username: string;
  password: string;
}

const tokenBus = new B.Bus<any, string | null>();
const loginBus = new B.Bus<any, Session | null>();
const sessionBus = new B.Bus<any, Session | null>();

export const tokenP = tokenBus.toProperty(null);
export const sessionP = sessionBus.toProperty(null);
export const validSessionE: B.EventStream<any, Session> = sessionP.filter(s => s !== null) as any;
export const userMapE: B.EventStream<any, Map<User>> = validSessionE.map(s => toMap(s.users, 'id'));
export const sourceMapE: B.EventStream<any, Map<Source>> = validSessionE.map(s => toMap(s.sources, 'id'));


import * as apiConnect from './ApiConnect';
import { Map } from '../../shared/util/Util';
import { toMap, flatten } from '../../shared/util/Arrays';

const refreshTokenKey = 'refreshToken';

export function getTitle(group?: Group) {
  const groupName = group ? group.name : undefined;
  const title = groupName ? `Kukkaro - ${groupName}` : 'Kukkaro';
  return title;
}

function clearLoginData() {
  document.title = getTitle();
  sessionBus.push(null);
  tokenBus.push(null);
  localStorage.removeItem(refreshTokenKey);
}

async function getLoginFromLocalStorage(): Promise<Session | null> {
  const token = localStorage.getItem(refreshTokenKey);
  if (!token) {
    debug('No token present, not logged in');
    tokenBus.push(null);
    return null;
  }
  debug('Not logged in but refresh token exists in localStorage', token);
  try {
    tokenBus.push(token);
    return await apiConnect.refreshSession();
  } catch (e) {
    debug('Token refresh failed');
    tokenBus.push(null);
    return null;
  }
}

loginBus.onValue(session => {
  debug('Current session is', session);
  if (!session) {
    clearLoginData();
    return;
  }
  state.init();
  state.setDataFromSession(session);
  if (session && session.refreshToken) {
    localStorage.setItem(refreshTokenKey, session.refreshToken);
  } else {
    localStorage.removeItem(refreshTokenKey);
  }
  document.title = getTitle(session.group);
  tokenBus.push(session.token);
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
    clearLoginData();
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
  clearLoginData();
}
