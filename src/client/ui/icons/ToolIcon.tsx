import * as React from 'react';

import { Icon, RenderIcon } from './Icons';

const styles = {
  tool: {
    padding: '9px 4px',
    width: '22px',
    height: '22px',
  },
};

export function ToolIcon(props: {
  icon: Icon;
  color?: string | null;
  title: string;
  style?: React.CSSProperties;
  className?: string;
  onClick: () => void;
}) {
  const { icon, ...rest } = props;
  return (
    <RenderIcon
      icon={icon}
      {...rest}
      color="action"
      style={{
        ...styles.tool,
        ...props.style,
        color: props.color || undefined,
      }}
    />
  );
}
