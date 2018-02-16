import { Map } from './Objects';
import { AuthenticationError, Error } from '../types/Errors';
const debug = require('debug')('net:fetch-client');

export type FetchType = () => (input: RequestInfo, init?: FixedRequestInit) => Promise<Response>;

export class FetchClient {

  private fetch: FetchType;
  private baseUrl: string;

  constructor(f: FetchType, base: string = '') {
    this.fetch = f;
    this.baseUrl = base;
  }

  public toQuery(path: string, query?: Map<any>): string {
    const fullPath = this.baseUrl + path;
    return query ? fullPath + '?' +
      Object.keys(query)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(query[k])).join('&')
      : fullPath;
  }

  private async req<T>(path: string, { method, query, body, headers }:
    { method: string, query?: Map<any>, body?: any, headers?: Map<string> }): Promise<T> {
    try {
      const queryPath = this.toQuery(path, query);
      debug(`${method} ${queryPath}`, 'with body', body);
      const options = {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers,
      };
      const res = await this.fetch()(queryPath, options);
      debug(`${method} ${queryPath}`, 'result', res.status);
      switch (res.status) {
        case 200: return await res.json() as T;
        case 401:
        case 403: throw new AuthenticationError('Unauthorized: ' + res.status, await res.json());
        default: throw new Error('Error in fetch client', await res.json(), res.status);
      }
    } catch (e) {
      debug('Error in fetch client:', e);
      throw e;
    }
  }

  public static contentTypeJson: Map<string> = { 'Content-Type': 'application/json' };

  public get<T>(path: string, query?: Map<any>, headers?: Map<string>): Promise<T> {
    return this.req(path, { method: 'GET', query, headers });
  }

  public put<T>(path: string, body?: any, query?: Map<any>, headers?: Map<string>): Promise<T> {
    debug('put put');
    return this.req(path, { method: 'PUT', body, query, headers: { ...FetchClient.contentTypeJson, ...headers } as Map<string> });
  }

  public post<T>(path: string, body?: any, query?: Map<any>, headers?: Map<string>): Promise<T> {
    return this.req(path, { method: 'POST', body, query, headers: { ...FetchClient.contentTypeJson, ...headers } as Map<string> });
  }

  public del<T>(path: string, data?: any, query?: Map<any>, headers?: Map<string>): Promise<T> {
    return this.req(path, { method: 'DELETE', query, headers });
  }

}
