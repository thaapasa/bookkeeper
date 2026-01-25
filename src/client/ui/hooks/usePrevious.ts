import React from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const [prev, setPrev] = React.useState<T | undefined>(undefined);
  const [current, setCurrent] = React.useState<T>(value);

  if (value !== current) {
    setPrev(current);
    setCurrent(value);
  }

  return prev;
}
