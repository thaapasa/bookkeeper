import { Title as MantineTitle, TitleProps } from '@mantine/core';
import React from 'react';

import { neutral } from '../Colors';

export const Title: React.FC<Omit<TitleProps, 'order'> & { order?: TitleProps['order'] }> = ({
  order = 1,
  ...props
}) => (
  <MantineTitle
    order={order}
    mb="md"
    pb={4}
    style={{ borderBottom: `1px solid ${neutral[3]}` }}
    {...props}
  />
);

export const Subtitle: React.FC<Omit<TitleProps, 'order'> & { order?: TitleProps['order'] }> = ({
  order = 2,
  ...props
}) => (
  <MantineTitle
    order={order}
    mb="xs"
    pb={2}
    style={{ borderBottom: `1px solid ${neutral[1]}` }}
    {...props}
  />
);
