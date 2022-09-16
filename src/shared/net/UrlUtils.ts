export function parseQueryString(query: string): Record<string, string> {
  if (!query || query.length < 1) {
    return {};
  }
  const p = query.indexOf('?') >= 0 ? query.split('?', 2)[1] : query;
  const res: Record<string, string> = {};
  const parts = p.split('&').map(p => p.split('=', 2));
  parts.forEach(
    p => (res[decodeURIComponent(p[0])] = decodeURIComponent(p[1]))
  );
  return res;
}

/**
 * This is a string interpolator that automatically encode URI components.
 * All variables used to construct the string are URL-encoded.
 * This allows you to create properly formatted URLs (or URIs) with
 * code like this:
 *
 * ```ts
 * const path = uri`https://server.com/thing/${thingId}?param=${param}`
 * ```
 */
export function uri(strings: TemplateStringsArray, ...keys: any[]) {
  let res = '';
  for (let i = 0; i < strings.length; ++i) {
    res = res.concat(strings[i]);
    const v = keys[i];
    if (i < strings.length - 1 && v !== undefined) {
      res = res.concat(encodeURIComponent(String(v)));
    }
  }
  return res;
}
