import * as React from 'react';

export function useForceReload() {
  const [counter, setCounter] = React.useState(0);
  const forceReload = React.useCallback(() => setCounter(c => c + 1), []);
  return { counter, forceReload };
}
