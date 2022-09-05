import React from 'react';

/**
 * Calls the given callback function when the tracked variable changes.
 * Use for debugging, for example.
 */
export function useWhenChanged<T>(
  value: T,
  callback: (newValue: T, oldValue: T) => void
) {
  const ref = React.useRef<{ value: T } | undefined>(undefined);
  if (ref.current === undefined) {
    ref.current = { value };
  } else {
    if (ref.current.value !== value) {
      callback(value, ref.current.value);
      ref.current.value = value;
    }
  }
}
