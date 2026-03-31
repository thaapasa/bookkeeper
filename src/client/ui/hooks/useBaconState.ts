import * as B from 'baconjs';
import * as React from 'react';

/**
 * Subscribe to a Bacon.js Observable and return the latest value.
 * Returns `undefined` until the first value is emitted.
 * Automatically unsubscribes on unmount.
 */
export function useBaconState<T>(observable: B.Observable<T>): T | undefined {
  const [state, setState] = React.useState<T>();
  React.useEffect(() => observable.onValue(setState), [observable]);
  return state;
}
