import React from 'react';

export function useToggle(initial = false) {
  const [status, setStatus] = React.useState(initial);
  const toggle = React.useCallback(
    () => setStatus(!status),
    [status, setStatus]
  );
  return [status, toggle, setStatus] as const;
}
