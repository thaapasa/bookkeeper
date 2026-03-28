import * as React from 'react';

/**
 * Functions in the same way as React.memo() but is guaranteed to keep the persisted value
 * unless the dependencies change. React.memo() may arbitrarily re-create the memoized object.
 */
export function usePersistentMemo<T>(value: () => T, deps: React.DependencyList): T {
  const [state, setState] = React.useState<{ value: T; deps: React.DependencyList }>(() => ({
    value: value(),
    deps,
  }));

  // Check if deps have changed
  if (!areHookInputsEqual(deps, state.deps)) {
    // Update state synchronously during render (valid React pattern)
    const newValue = value();
    setState({ value: newValue, deps });
    return newValue;
  }

  return state.value;
}

// Copied from React code
export function areHookInputsEqual(
  nextDeps: React.DependencyList,
  prevDeps: React.DependencyList | null,
) {
  if (prevDeps === null) {
    return false;
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (!is(nextDeps[i], prevDeps[i])) {
      return false;
    }
  }
  return true;
}

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x: unknown, y: unknown) {
  // biome-ignore lint/suspicious/noSelfCompare: Checking for NaN
  return (x === y && (x !== 0 || 1 / (x as number) === 1 / (y as number))) || (x !== x && y !== y);
}
