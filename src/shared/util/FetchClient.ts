import { AuthenticationError, Error } from '../types/Errors';
import debug from 'debug';
const log = debug('net:fetch-client');

export type FetchType = () => (
  input: RequestInfo,
  init?: FixedRequestInit
) => Promise<Response>;

function encodeComponent(x: any) {
  if (!x) {
    return '';
  } else if (typeof x === 'string') {
    return encodeURIComponent(x);
  } else {
    return encodeURIComponent(JSON.stringify(x));
  }
}

export class FetchClient {
  private fetch: FetchType;
  private baseUrl: string;

  constructor(f: FetchType, base = '') {
    this.fetch = f;
    this.baseUrl = base;
  }

  public toQuery(path: string, query?: Record<string, any>): string {
    const fullPath = this.baseUrl + path;
    return query
      ? fullPath +
          '?' +
          Object.keys(query)
            .map(k => encodeComponent(k) + '=' + encodeComponent(query[k]))
            .join('&')
      : fullPath;
  }

  private async req<T>(
    path: string,
    {
      method,
      query,
      body,
      headers,
    }: {
      method: string;
      query?: Record<string, any>;
      body?: any;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    try {
      const queryPath = this.toQuery(path, query);
      log(`${method} ${queryPath}`, 'with body', body);
      const options = {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers,
      };
      const res = await this.fetch()(queryPath, options);
      log(`${method} ${queryPath}`, 'result', res.status);
      switch (res.status) {
        case 200:
          return (await res.json()) as T;
        case 401:
        case 403:
          throw new AuthenticationError(
            'Unauthorized: ' + res.status,
            await res.json()
          );
        default:
          throw new Error(
            'Error in fetch client',
            await res.json(),
            res.status
          );
      }
    } catch (e) {
      log('Error in fetch client:', e);
      throw e;
    }
  }

  public static contentTypeJson: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  public get<T>(
    path: string,
    query?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.req(path, { method: 'GET', query, headers });
  }

  public put<T>(
    path: string,
    body?: any,
    query?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T> {
    log('put put');
    return this.req(path, {
      method: 'PUT',
      body,
      query,
      headers: { ...FetchClient.contentTypeJson, ...headers } as Record<
        string,
        string
      >,
    });
  }

  public post<T>(
    path: string,
    body?: any,
    query?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.req(path, {
      method: 'POST',
      body,
      query,
      headers: { ...FetchClient.contentTypeJson, ...headers } as Record<
        string,
        string
      >,
    });
  }

  public del<T>(
    path: string,
    data?: any,
    query?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.req(path, { method: 'DELETE', query, headers });
  }
}
