import * as React from 'react';

export function useForceReload() {
  const [counter, setCounter] = React.useState(0);
  const forceReload = React.useCallback(() => setCounter(counter + 1), [setCounter, counter]);
  return { counter, forceReload };
}
