import * as React from 'react';

/**
 * Functions in the same way as React.memo() but is guaranteed to keep the persisted value
 * unless the dependencies change. React.memo() may arbitrarily re-create the memoized object.
 */
export function usePersistentMemo<T>(value: () => T, deps: any[]): T {
  const valueRef = React.useRef<T | null>(null);
  const depsRef = React.useRef<any[] | null>(null);

  if (!valueRef.current) {
    valueRef.current = value();
    depsRef.current = deps;
  } else if (!areHookInputsEqual(deps, depsRef.current)) {
    valueRef.current = value();
    depsRef.current = deps;
  }
  return valueRef.current;
}

// Copied from React code
export function areHookInputsEqual(nextDeps: any[], prevDeps: any[] | null) {
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
function is(x: any, y: any) {
  // biome-ignore lint/suspicious/noSelfCompare: Checking for NaN
  return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
}
