import { ActionIconProps } from '@mantine/core';
import * as React from 'react';

import { ToolIcon } from '../icons/ToolIcon';

export const ExpanderIcon: React.FC<
  {
    title: string;
    open: boolean;
    onToggle: (state: boolean) => void;
  } & ActionIconProps
> = ({ title, open, onToggle, ...props }) => (
  <ToolIcon
    title={title}
    onClick={() => onToggle(!open)}
    icon={open ? 'ExpandLess' : 'ExpandMore'}
    {...props}
  />
);
