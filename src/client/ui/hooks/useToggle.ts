import React from 'react';

export function useToggle(initial = false) {
  const [status, setStatus] = React.useState(initial);
  const toggle = React.useCallback(() => setStatus(s => !s), []);
  return [status, toggle, setStatus] as const;
}
