import React from 'react';

import { toArray } from 'shared/util/Arrays';

/**
 * @return hook functions for managing the contents of a list
 */
export function useList<T>(initial?: T[]) {
  const [list, setList] = React.useState<T[]>(initial ?? []);
  const addItems = React.useCallback(
    (items: T | T[]) =>
      setList([...list, ...toArray(items).filter(i => !list.includes(i))]),
    [list, setList]
  );
  const removeItem = React.useCallback(
    (t: T) => setList(list.filter(l => l !== t)),
    [list, setList]
  );
  return { list, addItems, removeItem };
}
