import * as React from 'react';

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
