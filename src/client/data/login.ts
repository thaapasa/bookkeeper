import * as Bacon from 'baconjs';
import * as apiConnect from './api-connect';
import * as state from './state';
import { Session } from '../../shared/types/session';
const debug = require('debug')('bookkeeper:login');

export const loginStream = new Bacon.Bus<any, Session | null>();
const currentSessionStream = new Bacon.Bus<any, Session | null>();
export const currentSession = currentSessionStream.toProperty(null);

function getLoginFromSession(): Promise<Session | null> {
    const token = localStorage.getItem("refreshToken");
    if (token) {
        debug('Not logged in but refresh token exists in localStorage', token);
        state.set('token', token);
        return apiConnect.refreshSession()
            .catch(e => null);
    }
    else return Promise.resolve(null);
}

export async function checkLoginState(): Promise<Session | null> {
    const u = await getLoginFromSession();
    loginStream.push(u);
    return u;
}

export async function logout(): Promise<boolean> {
    const session = state.get('session');
    if (session && session.token) {
        await apiConnect.logout();
        loginStream.push(null);
    }
    return true;
}

loginStream.onValue(session => {
    debug('Current session', session);
    state.init();
    state.setDataFromSession(session);
    if (session && session.refreshToken) { 
        localStorage.setItem('refreshToken', session.refreshToken); 
    } else {
        localStorage.removeItem('refreshToken'); 
    }
    document.title = state.getTitle();
    currentSessionStream.push(session);
});
