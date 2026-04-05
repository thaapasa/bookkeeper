import * as React from 'react';

/**
 * Runs the given function when the parent is unmounted.
 * @param deps if given, will run the unsubscribe and update the function
 * when the deps change before parent unmounts
 */
export function useOnUnmount<F extends () => void>(f: F, deps?: React.DependencyList): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => f, deps ?? []);
}
