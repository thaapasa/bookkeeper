import * as React from 'react';

/**
 * Returns a reference to the object that changes when the reference changes
 */
export function useObjectMemo<O extends object>(o: O): O {
  const deps = [...Object.keys(o), ...Object.values(o)];
  return React.useMemo(() => ({ ...o }), deps);
}
