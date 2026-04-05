import * as B from 'baconjs';
import * as React from 'react';

/**
 * Subscribe to a Bacon.js Property and return the latest value.
 * Properties always have a current value, so this never returns undefined.
 * Automatically unsubscribes on unmount.
 */
export function useBaconProperty<T>(property: B.Property<T>): T {
  const [state, setState] = React.useState<T>(() => {
    // Properties emit their current value synchronously on subscribe
    let initial: T | undefined;
    property.onValue(v => (initial = v))();
    return initial as T;
  });
  React.useEffect(() => property.onValue(setState), [property]);
  return state;
}

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
