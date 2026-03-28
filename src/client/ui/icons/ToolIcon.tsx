import { ActionIcon, ActionIconProps } from '@mantine/core';
import * as React from 'react';

import { Icon, RenderIcon } from './Icons';

export function ToolIcon({
  icon,
  className,
  size = 'md',
  title,
  onClick,
  ...props
}: {
  onClick?: React.MouseEventHandler;
  title: string;
  icon: Icon;
} & ActionIconProps) {
  return (
    <ActionIcon variant="subtle" size={size} title={title} onClick={onClick} {...props}>
      <RenderIcon icon={icon} color={props.color || 'action'} style={{ width: 18, height: 18 }} />
    </ActionIcon>
  );
}
