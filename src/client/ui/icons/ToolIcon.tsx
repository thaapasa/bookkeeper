import { ActionIcon } from '@mantine/core';
import * as React from 'react';

import { Icon, RenderIcon } from './Icons';

export function ToolIcon(props: {
  icon: Icon;
  color?: string | null;
  title: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}) {
  const { icon, className } = props;
  return (
    <ActionIcon
      variant="subtle"
      size="sm"
      title={props.title}
      onClick={props.onClick}
      className={className}
      style={props.style}
    >
      <RenderIcon icon={icon} color={props.color || 'action'} style={{ width: 18, height: 18 }} />
    </ActionIcon>
  );
}
