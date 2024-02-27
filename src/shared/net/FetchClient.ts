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

export type RequestMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestSpec {
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  /**
   * Explicitly sets the Content-Type header for the request;
   * or pass `null` to bypass Content-Type calculation and let native fetch
   * pick proper content type.
   */
  contentType?: string | null;
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

  async req<T>(path: string, method: RequestMethod, spec: RequestSpec = {}): Promise<T> {
    const queryPath = this.toQuery(path, spec.query);
    const { body, contentType } = determineContent(spec);
    this.logger?.info(`${method} ${queryPath}`);
    const headers = {
      ...(contentType ? { 'Content-Type': contentType } : undefined),
      ...spec.headers,
    };
    const options = { method, body, headers };
    this.logger?.debug(options, path);
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
        throw new AuthenticationError(
          'UNAUTHORIZED',
          'Unauthorized: ' + res.status,
          await res.json(),
        );
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

  public get = <T>(path: string, spec?: RequestSpec) => this.req<T>(path, 'GET', spec);
  public put = <T>(path: string, spec?: RequestSpec) => this.req<T>(path, 'PUT', spec);
  public post = <T>(path: string, spec?: RequestSpec) => this.req<T>(path, 'POST', spec);
  public patch = <T>(path: string, spec?: RequestSpec) => this.req<T>(path, 'PATCH', spec);
  public delete = <T>(path: string, spec?: RequestSpec) => this.req<T>(path, 'DELETE', spec);
}

const JSONableContentTypes = ['object', 'string', 'number', 'boolean'];
function determineContent(spec: RequestSpec): { body: any; contentType?: string } {
  if (!spec.body) {
    return { body: undefined, contentType: spec.contentType ?? ContentTypes.json };
  }
  if (spec.contentType !== undefined) {
    // Predefined content type, so use that
    const ctype = plainCType(spec.contentType ?? '');
    return {
      body: ctype === ContentTypes.json ? JSON.stringify(spec.body) : spec.body,
      contentType: spec.contentType ?? undefined,
    };
  }
  if (spec.body instanceof FormData) {
    // Native fetch can pick the correct content type
    return { body: spec.body };
  }
  if (JSONableContentTypes.includes(typeof spec.body) && isDefined(spec.body)) {
    // Convert to JSON
    return { body: JSON.stringify(spec.body), contentType: ContentTypes.json };
  }
  // Let fetch pick the content type automatically
  return { body: spec.body };
}

function plainCType(contentType: string = '') {
  return contentType.toLowerCase().split(';')[0];
}
