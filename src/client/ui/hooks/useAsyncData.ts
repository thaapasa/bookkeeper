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
  const loadData = React.useCallback(() => {
    if (valid) {
      setData({ type: 'loading' });
      dataSource(...params)
        .then(value => setData({ type: 'loaded', value }))
        .catch(error => setData({ type: 'error', error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, dataSource, setData, ...params]);

  return {
    data,
    valid,
    loadData,
  };
}
