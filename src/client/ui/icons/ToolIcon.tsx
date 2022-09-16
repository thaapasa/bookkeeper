import { SvgIconProps } from '@mui/material/SvgIcon';
import * as React from 'react';

const styles = {
  tool: {
    padding: '9px 4px',
    width: '22px',
    height: '22px',
  },
};

export function ToolIcon(props: {
  icon: React.ComponentType<SvgIconProps>;
  color?: string | null;
  title: string;
  style?: React.CSSProperties;
  className?: string;
  onClick: () => void;
}) {
  const { icon, ...rest } = props;
  const Type = icon;
  return (
    <Type
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
