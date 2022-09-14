import React from 'react';
import { z } from 'zod';

import { toArray } from 'shared/util/Arrays';

import { useForceReload } from './useForceReload';

const DefaultCompare = (a: any, b: any): boolean => a === b;

/**
 * @return hook functions for managing the contents of a list
 */
export function useLocalStorageList<T>(
  key: string,
  initial?: T[],
  codec?: z.ZodType<T[]>,
  cmp: (a: T, b: T) => boolean = DefaultCompare
) {
  const reloader = useForceReload();
  const list = React.useRef<T[]>(initial ?? []);

  const addItems = React.useCallback(
    (items: T | T[]) => {
      list.current = [
        ...list.current,
        ...toArray(items).filter(i => !list.current.find(i2 => cmp(i, i2))),
      ];
      reloader();
    },
    [reloader, cmp]
  );
  const removeItem = React.useCallback(
    (t: T | T[]) => {
      const tAr = toArray(t);
      list.current = list.current.filter(l => !tAr.find(l2 => cmp(l, l2)));
      reloader();
    },
    [reloader, cmp]
  );
  const clear = React.useCallback(() => {
    list.current = [];
    reloader();
  }, [reloader]);

  return { list: list.current, addItems, removeItem, clear };
}
