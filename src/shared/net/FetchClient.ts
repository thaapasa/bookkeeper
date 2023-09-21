import type nodeFetch from 'node-fetch';
import { Logger } from 'pino';

import { isDefined } from '../types/Common';
import { AuthenticationError, BkError } from '../types/Errors';
import { ContentTypes } from './ContentTypes';

export type FetchType = typeof nodeFetch | Window['fetch'];
type ResponseType = Awaited<ReturnType<FetchType>>;

function encodeComponent(x: any) {
  if (!isDefined(x)) {
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

  constructor(
    f: FetchType,
    base = '',
    private logger?: Logger,
  ) {
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

  async req<T>(
    path: string,
    {
      method,
      query,
      body,
      headers: incomingHeaders,
    }: {
      method: string;
      query?: Record<string, any>;
      body?: any;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const queryPath = this.toQuery(path, query);
    this.logger?.debug(body, `${method} ${queryPath} with body`);
    const { headers, contentType } = this.prepareHeaders(incomingHeaders);
    this.logger?.info({ headers, contentType, body }, path);
    const options = {
      method,
      body: body ? (contentType === ContentTypes.json ? JSON.stringify(body) : body) : undefined,
      headers,
    };
    let res: ResponseType;
    try {
      res = await this.fetch(queryPath, options);
    } catch (e) {
      throw new BkError(`NETWORK_ERROR`, e, 0);
    }
    this.logger?.debug(`${method} ${queryPath} -> ${res.status}`);
    switch (res.status) {
      case 200:
      case 204:
        return await this.readResponse<T>(res);
      case 401:
      case 403:
        throw new AuthenticationError('Unauthorized: ' + res.status, await res.json());
      default: {
        const data = await res.json();
        this.logger?.warn(data, 'Error received from API');
        throw new BkError(
          'code' in data ? data.code : 'ERROR',
          `Error ${res.status} from ${method} ${path}`,
          res.status,
          data,
        );
      }
    }
  }

  private prepareHeaders(headers: Record<string, string> = {}) {
    const { 'Content-Type': CType, 'content-type': ctype, ...hdrs } = headers ?? {};
    const fullContentType = (CType ?? ctype) || undefined;
    const [contentType] = (fullContentType ?? '').split(';');
    if (fullContentType) {
      hdrs['Content-Type'] = fullContentType;
    }
    return { headers: hdrs, contentType: contentType || undefined };
  }

  private async readResponse<T>(res: ResponseType): Promise<T> {
    if (res.status === 204) {
      // Server indicated NO CONTENT, don't try to parse it
      return undefined as T;
    }
    const type = res.headers.get('content-type') ?? '';
    const [simpleType] = type.split(';');

    switch (simpleType) {
      case ContentTypes.html:
      case ContentTypes.text:
        return (await res.text()) as T;

      case ContentTypes.json:
        return (await res.json()) as T;

      default:
        return (await res.text()) as T;
    }
  }

  public static contentTypeJson: Record<string, string> = {
    'Content-Type': ContentTypes.json,
  };

  public get<T>(
    path: string,
    query?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.req(path, { method: 'GET', query, headers });
  }

  public put<T>(
    path: string,
    body?: any,
    query?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.req(path, {
      method: 'PUT',
      body,
      query,
      headers: { ...FetchClient.contentTypeJson, ...headers } as Record<string, string>,
    });
  }

  public post<T>(
    path: string,
    body?: any,
    query?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.req(path, {
      method: 'POST',
      body,
      query,
      headers: { ...FetchClient.contentTypeJson, ...headers } as Record<string, string>,
    });
  }

  public del<T>(
    path: string,
    data?: any,
    query?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.req(path, { method: 'DELETE', query, headers, body: data });
  }
}
