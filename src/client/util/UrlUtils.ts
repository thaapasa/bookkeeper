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

export function reloadApp() {
  document.location.href = `/?refresh=${Math.random()}`;
}
