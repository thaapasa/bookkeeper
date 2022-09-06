import React from 'react';

import { toArray } from 'shared/util/Arrays';

import { useLocalStorage } from './useLocalStorage';

/**
 * @return hook functions for managing the contents of a list
 */
export function useLocalStorageList<T>(key: string, initial?: T[]) {
  const [list, setList] = useLocalStorage<T[]>(key, initial ?? []);
  const addItems = React.useCallback(
    (items: T | T[]) =>
      setList([...list, ...toArray(items).filter(i => !list.includes(i))]),
    [list, setList]
  );
  const removeItem = React.useCallback(
    (t: T) => setList(list.filter(l => l !== t)),
    [list, setList]
  );
  const clear = React.useCallback(() => setList([]), [setList]);
  return { list, addItems, removeItem, clear };
}
