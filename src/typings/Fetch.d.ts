declare interface FixedRequestInit {
  body?: any;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headers?: { [key: string]: string } | undefined;
  integrity?: string;
  keepalive?: boolean;
  method?: string;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  window?: any;
}

declare function fetch(
  input: RequestInfo,
  init?: FixedRequestInit
): Promise<Response>;
