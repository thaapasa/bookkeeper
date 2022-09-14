import React from 'react';

import { toArray } from 'shared/util/Arrays';

import { useLocalStorage } from './useLocalStorage';

const DefaultCompare = (a: any, b: any): boolean => a === b;

/**
 * @return hook functions for managing the contents of a list
 */
export function useLocalStorageList<T>(
  key: string,
  initial?: T[],
  cmp: (a: T, b: T) => boolean = DefaultCompare
) {
  const [list, setList] = useLocalStorage<T[]>(key, initial ?? []);
  const addItems = React.useCallback(
    (items: T | T[]) =>
      setList([
        ...list,
        ...toArray(items).filter(i => !list.find(i2 => cmp(i, i2))),
      ]),
    [list, setList, cmp]
  );
  const removeItem = React.useCallback(
    (t: T | T[]) => {
      const tAr = toArray(t);
      setList(list.filter(l => !tAr.find(l2 => cmp(l, l2))));
    },
    [list, setList, cmp]
  );
  const clear = React.useCallback(() => setList([]), [setList]);
  return { list, addItems, removeItem, clear };
}
