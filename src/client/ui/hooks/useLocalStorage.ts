import debug from 'debug';
import React from 'react';
import { z } from 'zod';

import { isDefined } from 'shared/types';

const log = debug('bookkeeper:local-storage');

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  codec?: z.ZodType<T>,
  init?: (v: T) => T
) {
  if (typeof initialValue === 'function') {
    throw new Error(
      `Cannot store function to localStorage; got ${initialValue.name}`
    );
  }
  const [value, setValue] = React.useState<T>(() =>
    readStored(key, initialValue, codec, init)
  );

  const storeItem = React.useCallback(
    (v: T) => {
      if (typeof v === 'function') {
        throw new Error(`Cannot store function to localStorage; got ${v.name}`);
      }

      log('Storing', key, v);
      localStorage.setItem(key, JSON.stringify(v));
      setValue(v);
    },
    [setValue, key]
  );

  return [value, storeItem] as const;
}

function readStored<T>(
  key: string,
  defaultValue: T,
  codec?: z.ZodType<T>,
  init?: (v: T) => T
) {
  try {
    const v = localStorage.getItem(key);
    if (!isDefined(v)) return defaultValue;
    const json = JSON.parse(v);
    if (codec) {
      const parsed = codec.safeParse(json);
      log('Parsed', json, 'to', parsed);
      const p = parsed.success ? parsed.data : defaultValue;
      return init ? init(p) : p;
    }
    return init ? init(json) : json;
  } catch (e) {
    return defaultValue;
  }
}
