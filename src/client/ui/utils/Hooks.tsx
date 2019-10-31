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
