import * as React from 'react';

import { AsyncData, UnitializedData } from 'client/data/AsyncData';

export function useAsyncData<T, P extends any[]>(
  dataSource: (...params: P) => Promise<T>,
  valid: boolean,
  ...params: P
) {
  const [data, setData] = React.useState<AsyncData<T>>(UnitializedData);
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
