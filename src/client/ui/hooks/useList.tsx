import React from 'react';
import { z } from 'zod';

import { toArray } from 'shared/util';

import { useLocalStorage } from './useLocalStorage';

const DefaultCompare = (a: unknown, b: unknown): boolean => a === b;

/**
 * @return hook functions for managing the contents of a list
 */
export function useLocalStorageList<T>(
  key: string,
  initial?: T[],
  codec?: z.ZodType<T[]>,
  cmp: (a: T, b: T) => boolean = DefaultCompare,
  checkEntity?: (t: T) => boolean,
) {
  const [list, setList] = useLocalStorage(key, initial ?? [], codec, l =>
    checkEntity ? (l?.filter(checkEntity) ?? []) : (l ?? []),
  );

  const addItems = React.useCallback(
    (items: T | T[]) => {
      setList(currentList => [
        ...currentList,
        ...toArray(items).filter(i => !currentList.find(i2 => cmp(i, i2))),
      ]);
    },
    [setList, cmp],
  );

  const removeItem = React.useCallback(
    (t: T | T[]) => {
      const tAr = toArray(t);
      setList(currentList => currentList.filter(l => !tAr.find(l2 => cmp(l, l2))));
    },
    [setList, cmp],
  );

  const clear = React.useCallback(() => {
    setList([]);
  }, [setList]);

  const toggleItem = React.useCallback(
    (t: T) => {
      setList(currentList => {
        if (currentList.find(l => cmp(l, t))) {
          return currentList.filter(l => !cmp(l, t));
        }
        return [...currentList, t];
      });
    },
    [setList, cmp],
  );

  return { list, addItems, removeItem, toggleItem, clear };
}
