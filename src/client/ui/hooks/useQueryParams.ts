import { useMemo } from 'react';

export function useQueryParams() {
  const search = window.location.search;
  return useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const params: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  }, [search]);
}
