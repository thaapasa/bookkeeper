import React from 'react';

const DefaultDebounceTimeMs = 300;

/**
 * @return the value, after timeout has passed (if no other value has been given)
 */
export function useDebounced<T>(t: T, timeoutMs = DefaultDebounceTimeMs) {
  const [value, setValue] = React.useState<T | undefined>(undefined);

  React.useEffect(() => {
    // If values are the same, no need to debounce
    if (value === t) {
      return;
    }

    // Set a timeout to update the value
    const timeout = setTimeout(() => setValue(t), timeoutMs);

    // Cleanup: clear the timeout on unmount or when dependencies change
    return () => clearTimeout(timeout);
  }, [t, timeoutMs, value]);

  return value;
}
