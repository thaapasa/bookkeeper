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

export function reloadApp(path = '/') {
  document.location.href = `${path}?refresh=${Math.random()}`;
}

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
