import React from 'react';

import { isDefined } from 'shared/types/Common';

export function useLocalStorage<T>(key: string, initialValue: T) {
  if (typeof initialValue === 'function') {
    throw new Error(
      `Cannot store function to localStorage; got ${initialValue.name}`
    );
  }
  const [value, setValue] = React.useState<T>(() =>
    readStored(key, initialValue)
  );

  React.useEffect(() => {
    const v = localStorage.getItem(key);
    if (isDefined(v)) {
      setValue(JSON.parse(v));
    }
  }, [setValue, key]);

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
    if (isDefined(v)) {
      return JSON.parse(v);
    }
  } catch (e) {
    return defaultValue;
  }
}
