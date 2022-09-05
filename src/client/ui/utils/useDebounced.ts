import React from 'react';

type TimeoutHandle = ReturnType<typeof setTimeout>;

const DefaultDebounceTimeMs = 300;

/**
 * @return the value, after timeout has passed (if no other value has been given)
 */
export function useDebounced<T>(t: T, timeoutMs = DefaultDebounceTimeMs) {
  const [value, setValue] = React.useState<T | undefined>(undefined);
  const ref = React.useRef<TimeoutHandle | undefined>(undefined);

  // Clear existing timeout (incoming new value)
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = undefined;
  }

  if (value !== t) {
    // Update value after timeout
    ref.current = setTimeout(() => setValue(t), timeoutMs);
  }

  return value;
}
