import React from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function useCompare<T>(val: T): boolean {
  const prevVal = usePrevious(val);
  return prevVal !== val;
}

export function useToggle(initial = false) {
  const [status, setStatus] = React.useState(initial);
  const toggle = React.useCallback(
    () => setStatus(!status),
    [status, setStatus]
  );
  return [status, toggle, setStatus] as const;
}

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
