import fetch from 'node-fetch';

import { Session } from '../../types/Session';
import { FetchClient } from '../FetchClient';

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function createTestClient(baseUrl?: string) {
  const client = new FetchClient(
    fetch as any,
    baseUrl ?? 'http://localhost:3100'
  );

  const get = <T>(token: string, path: string, query?: Record<string, any>) =>
    client.get<T>(path, query, authHeader(token));

  const put = <T>(token: string, path: string, data: any) =>
    client.put<T>(path, data, undefined, authHeader(token));

  const post = <T>(token: string, path: string, data: any) =>
    client.post<T>(path, data, undefined, authHeader(token));

  const del = <T>(token: string, path: string, query?: Record<string, any>) =>
    client.del<T>(path, undefined, query, authHeader(token));

  const decorateSession = (s: Session): SessionWithControl => ({
    ...s,
    get: (path, query) => get(s.token, path, query),
    logout: () => del(s.token, '/api/session'),
    put: (path, data) => put(s.token, path, data),
    post: (path, data) => post(s.token, path, data),
    del: (path, query) => del(s.token, path, query),
  });

  const login = (username: string, password: string) =>
    client.put<Session>('/api/session', { username, password });

  const refresh = (refreshToken: string) =>
    put<Session>(refreshToken, '/api/session/refresh', {});

  return {
    get,
    put,
    post,
    del,
    login,
    refresh,

    getSession: async (
      username: string,
      password: string
    ): Promise<SessionWithControl> => {
      const session = await login(username, password);
      return decorateSession(session);
    },

    refreshSession: async (refreshToken: string) =>
      decorateSession(await refresh(refreshToken)),
  };
}

export interface SessionWithControl extends Session {
  get: <T>(path: string, query?: Record<string, any>) => Promise<T>;
  logout: () => Promise<void>;
  put: <T>(path: string, data: any) => Promise<T>;
  post: <T>(path: string, data: any) => Promise<T>;
  del: (path: string, query?: Record<string, any>) => Promise<void>;
}
