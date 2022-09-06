import React from 'react';

/**
 * @return hook functions for managing the contents of a list
 */
export function useList<T>(initial?: T[]) {
  const [list, setList] = React.useState<T[]>(initial ?? []);
  const addItem = React.useCallback(
    (t: T) => (!list.includes(t) ? setList([...list, t]) : undefined),
    [list, setList]
  );
  const removeItem = React.useCallback(
    (t: T) => setList(list.filter(l => l !== t)),
    [list, setList]
  );
  return { list, addItem, removeItem };
}
