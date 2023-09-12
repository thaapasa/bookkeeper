import { usePrevious } from './usePrevious';

/**
 * Calls the given callback function when the tracked variable changes.
 * Use for debugging, for example.
 *
 * @param value the value to track
 * @param callback optional callback to call when the value changes
 * @return the value, if it was changed; otherwise returns undefined
 */
export function useWhenChanged<T>(value: T, callback?: (newValue: T, oldValue: T | undefined) => void): T | undefined {
  const prevValue = usePrevious(value);
  if (prevValue !== value) {
    // Value changed
    callback?.(value, prevValue);
    return value;
  } else {
    return undefined;
  }
}
