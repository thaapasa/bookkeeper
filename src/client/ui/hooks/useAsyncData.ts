import * as React from 'react';

import { AsyncData, UninitializedData } from 'client/data/AsyncData';

export function useAsyncData<T, P extends any[]>(
  dataSource: (...params: P) => Promise<T>,
  valid: boolean,
  ...params: P
): AsyncData<T> {
  const [data, setData] = React.useState<AsyncData<T>>(UninitializedData);
  React.useEffect(() => {
    if (valid) {
      dataSource(...params)
        .then(value => setData({ type: 'loaded', value }))
        .catch(error => setData({ type: 'error', error }));
    }
  }, [valid, dataSource, ...params]);
  return data;
}

export function useDeferredData<T, P extends any[]>(
  dataSource: (...params: P) => Promise<T>,
  valid: boolean,
  ...params: P
) {
  const [data, setData] = React.useState<AsyncData<T>>(UninitializedData);
  const loadData = React.useCallback((): void => {
    if (valid) {
      dataSource(...params)
        .then(value => setData({ type: 'loaded', value }))
        .catch(error => setData({ type: 'error', error }));
    }
  }, [valid, dataSource, setData, ...params]);

  return {
    data,
    valid,
    loadData,
  };
}
