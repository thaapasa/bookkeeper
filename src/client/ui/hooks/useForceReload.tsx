import * as React from 'react';

export function useForceReload() {
  const [counter, setCounter] = React.useState(0);
  return React.useCallback(() => setCounter(counter + 1), [setCounter, counter]);
}
