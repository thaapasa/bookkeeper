import * as B from 'baconjs';
import * as state from './state';
import { Session } from '../../shared/types/Session';
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

import * as apiConnect from './api-connect';

const refreshTokenKey = 'refreshToken';

function clearLoginData() {
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
    document.title = state.getTitle();
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

export async function logout() {
    debug('Logging out');
    try {
        await apiConnect.logout();
    } catch (e) {
        debug('Error when logging out', e);
    } 
    clearLoginData();
}
