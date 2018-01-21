import { FetchClient, FetchType } from '../fetch-client';
import fetch from 'node-fetch';
import { Map } from '../util';
import { Session } from '../../types/session';

const debug = require('debug')('bookkeeper:test-client');
const baseUrl = 'http://localhost:3100';

const client = new FetchClient(() => fetch as any, baseUrl);

function authHeader(token: string) {
    return { 'Authorization': `Bearer ${token}` };
}

export function get<T>(token: string, path: string, query?: Map<any>): Promise<T> {
    return client.get<T>(path, query, authHeader(token));
}

export function put<T>(token: string, path: string, data: any): Promise<T> {
    return client.put<T>(path, data, undefined, authHeader(token));
}

export function post<T>(token: string, path: string, data: any): Promise<T> {
    return client.post<T>(path, data, undefined, authHeader(token));
}

export function del<T>(token: string, path: string, query?: Map<any>): Promise<T> {
    return client.del<T>(path, undefined, query, authHeader(token));
}

export function login(username: string, password: string): Promise<Session> {
    return client.put<Session>('/api/session', { username, password });
}

function refresh(refreshToken: string): Promise<Session> {
    return put<Session>(refreshToken, '/api/session/refresh', {});
}

export function getSession(username: string, password: string): Promise<SessionWithControl> {
    return login(username, password).then(decorateSession);
}

export async function refreshSession(refreshToken: string) {
    return decorateSession(await refresh(refreshToken));
}

export interface SessionWithControl extends Session {
    get: <T>(path: string, query?: Map<any>) => Promise<T>;
    logout: () => Promise<void>;
    put: <T>(path: string, data: any) => Promise<T>;
    post: <T>(path: string, data: any) => Promise<T>;
    del: (path: string, query?: Map<any>) => Promise<void>;
}

function decorateSession(s: Session): SessionWithControl {
    return {
        ...s,
        get: (path, query) => get(s.token, path, query),
        logout: () => del(s.token, '/api/session'),
        put: (path, data) => put(s.token, path, data),
        post: (path, data) => post(s.token, path, data),
        del: (path, query) => del(s.token, path, query)
    };
}
