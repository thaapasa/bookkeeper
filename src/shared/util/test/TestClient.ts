import fetch from 'node-fetch';

import { Session } from '../../types/Session';
import { FetchClient } from '../FetchClient';

const baseUrl = 'http://localhost:3100';

const client = new FetchClient(() => fetch as any, baseUrl);

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function get<T>(
  token: string,
  path: string,
  query?: Record<string, any>
): Promise<T> {
  return client.get<T>(path, query, authHeader(token));
}

export function put<T>(token: string, path: string, data: any): Promise<T> {
  return client.put<T>(path, data, undefined, authHeader(token));
}

export function post<T>(token: string, path: string, data: any): Promise<T> {
  return client.post<T>(path, data, undefined, authHeader(token));
}

export function del<T>(
  token: string,
  path: string,
  query?: Record<string, any>
): Promise<T> {
  return client.del<T>(path, undefined, query, authHeader(token));
}

export function login(username: string, password: string): Promise<Session> {
  return client.put<Session>('/api/session', { username, password });
}

function refresh(refreshToken: string): Promise<Session> {
  return put<Session>(refreshToken, '/api/session/refresh', {});
}

function decorateSession(s: Session): SessionWithControl {
  return {
    ...s,
    get: (path, query) => get(s.token, path, query),
    logout: () => del(s.token, '/api/session'),
    put: (path, data) => put(s.token, path, data),
    post: (path, data) => post(s.token, path, data),
    del: (path, query) => del(s.token, path, query),
  };
}

export async function getSession(
  username: string,
  password: string
): Promise<SessionWithControl> {
  const session = await login(username, password);
  return decorateSession(session);
}

export async function refreshSession(refreshToken: string) {
  return decorateSession(await refresh(refreshToken));
}

export interface SessionWithControl extends Session {
  get: <T>(path: string, query?: Record<string, any>) => Promise<T>;
  logout: () => Promise<void>;
  put: <T>(path: string, data: any) => Promise<T>;
  post: <T>(path: string, data: any) => Promise<T>;
  del: (path: string, query?: Record<string, any>) => Promise<void>;
}
