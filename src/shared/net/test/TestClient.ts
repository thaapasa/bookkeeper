import fetch from 'node-fetch';
import { Logger } from 'pino';

import { Session } from '../../types/Session';
import { FetchClient } from '../FetchClient';

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function createTestClient(opts: { baseUrl?: string; logger?: Logger }) {
  const client = new FetchClient(fetch, opts.baseUrl ?? 'http://localhost:3100', opts.logger);

  const get = <T>(token: string, path: string, query?: Record<string, any>) =>
    client.get<T>(path, { query, headers: authHeader(token) });

  const put = <T>(token: string, path: string, data: any) =>
    client.put<T>(path, { body: data, headers: authHeader(token) });

  const post = <T>(token: string, path: string, data: any) =>
    client.post<T>(path, { body: data, headers: authHeader(token) });

  const del = <T>(token: string, path: string, query?: Record<string, any>) =>
    client.delete<T>(path, { query, headers: authHeader(token) });

  const decorateSession = (s: Session): SessionWithControl => ({
    ...s,
    get: (path, query) => get(s.token, path, query),
    logout: () => del(s.token, '/api/session'),
    put: (path, data) => put(s.token, path, data),
    post: (path, data) => post(s.token, path, data),
    del: (path, query) => del(s.token, path, query),
  });

  const login = (username: string, password: string) =>
    client.post<Session>('/api/session', { body: { username, password } });

  const refresh = (refreshToken: string) => put<Session>(refreshToken, '/api/session/refresh', {});

  return {
    get,
    put,
    post,
    del,
    login,
    refresh,

    getSession: async (username: string, password: string): Promise<SessionWithControl> => {
      const session = await login(username, password);
      return decorateSession(session);
    },

    refreshSession: async (refreshToken: string) => decorateSession(await refresh(refreshToken)),
  };
}

export interface SessionWithControl extends Session {
  get: <T>(path: string, query?: Record<string, any>) => Promise<T>;
  logout: () => Promise<void>;
  put: <T>(path: string, data: any) => Promise<T>;
  post: <T>(path: string, data: any) => Promise<T>;
  del: (path: string, query?: Record<string, any>) => Promise<void>;
}
