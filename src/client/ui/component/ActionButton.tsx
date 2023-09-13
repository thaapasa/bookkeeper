import { Button, ButtonProps } from '@mui/material';
import * as React from 'react';

import { isPromise, MaybePromise } from 'shared/util';
import { AsyncData } from 'client/data/AsyncData';

type ActionButtonProps<T> = Omit<React.PropsWithChildren<ButtonProps>, 'onClick'> & {
  onClick: () => MaybePromise<T>;
};

export const ActionButton: React.FC<ActionButtonProps<any>> = <T,>({
  onClick,
  children,
  ...props
}: ActionButtonProps<T>) => {
  const [data, setData] = React.useState<AsyncData<T>>({
    type: 'uninitialized',
  });
  const clickHandler = () => {
    if (data.type === 'loading') return;
    setData({ type: 'loading' });
    const res = onClick();
    if (!isPromise(res)) {
      setData({ type: 'loaded', value: res });
      return;
    }
    res
      .then(value => setData({ type: 'loaded', value }))
      .catch(error => setData({ type: 'error', error }));
  };
  return (
    <Button {...props} onClick={clickHandler} disabled={data.type === 'loading'}>
      {children}
    </Button>
  );
};
