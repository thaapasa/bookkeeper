import { ActionIcon, ActionIconProps } from '@mantine/core';
import * as React from 'react';

import { Icons } from '../icons/Icons';

export const ExpanderIcon: React.FC<
  {
    title: string;
    open: boolean;
    onToggle: (state: boolean) => void;
  } & ActionIconProps
> = ({ title, open, onToggle, ...props }) => (
  <ActionIcon title={title} onClick={() => onToggle(!open)} {...props}>
    {open ? <Icons.ExpandLess /> : <Icons.ExpandMore />}
  </ActionIcon>
);
