import { Button, type ButtonProps } from '@mantine/core';
import * as React from 'react';

import { isPromise, MaybePromise } from 'shared/util';

type ActionButtonProps<T> = Omit<
  React.PropsWithChildren<ButtonProps & React.ComponentPropsWithoutRef<'button'>>,
  'onClick'
> & {
  onClick: () => MaybePromise<T>;
};

export const ActionButton = <T,>({
  onClick,
  children,
  ...props
}: ActionButtonProps<T>): React.ReactElement => {
  const [loading, setLoading] = React.useState(false);
  const clickHandler = () => {
    if (loading) return;
    const res = onClick();
    if (!isPromise(res)) return;
    setLoading(true);
    res.finally(() => setLoading(false));
  };
  return (
    <Button {...props} onClick={clickHandler} disabled={loading}>
      {children}
    </Button>
  );
};
