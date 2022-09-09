import React from 'react';

import { isDefined } from 'shared/types/Common';

export function useLocalStorage<T>(key: string, initialValue: T) {
  if (typeof initialValue === 'function') {
    throw new Error(
      `Cannot store function to localStorage; got ${initialValue.name}`
    );
  }
  const [value, setValue] = React.useState<T>(() =>
    readStored(key, readStored(key, initialValue))
  );

  const storeItem = React.useCallback(
    (v: T) => {
      if (typeof v === 'function') {
        throw new Error(`Cannot store function to localStorage; got ${v.name}`);
      }

      localStorage.setItem(key, JSON.stringify(v));
      setValue(v);
    },
    [setValue, key]
  );

  return [value, storeItem] as const;
}

function readStored<T>(key: string, defaultValue: T) {
  try {
    const v = localStorage.getItem(key);
    return isDefined(v) ? JSON.parse(v) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}