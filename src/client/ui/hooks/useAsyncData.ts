import * as React from 'react';

import { AsyncData, UninitializedData } from 'client/data/AsyncData';

export function useAsyncData<T, P extends any[]>(
  dataSource: (...params: P) => Promise<T>,
  valid: boolean,
  ...params: P
): AsyncData<T> {
  const [data, setData] = React.useState<AsyncData<T>>(UninitializedData);
  React.useEffect(() => {
    if (!valid) return;

    let cancelled = false;
    setData({ type: 'loading' });

    dataSource(...params)
      .then(value => {
        if (!cancelled) setData({ type: 'loaded', value });
      })
      .catch(error => {
        if (!cancelled) setData({ type: 'error', error });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, dataSource, ...params]);
  return data;
}

export function useDeferredData<T, P extends any[]>(
  dataSource: (...params: P) => Promise<T>,
  valid: boolean,
  ...params: P
) {
  const [data, setData] = React.useState<AsyncData<T>>(UninitializedData);
  const cancelRef = React.useRef<(() => void) | undefined>(undefined);

  const loadData = React.useCallback(() => {
    if (!valid) return;

    // Cancel any previous in-flight request
    cancelRef.current?.();

    let cancelled = false;
    cancelRef.current = () => {
      cancelled = true;
    };

    setData({ type: 'loading' });
    dataSource(...params)
      .then(value => {
        if (!cancelled) setData({ type: 'loaded', value });
      })
      .catch(error => {
        if (!cancelled) setData({ type: 'error', error });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, dataSource, ...params]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cancelRef.current?.();
    };
  }, []);

  return {
    data,
    valid,
    loadData,
  };
}
