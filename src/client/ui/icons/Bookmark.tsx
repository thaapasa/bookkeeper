import * as React from 'react';

import { colorScheme } from '../Colors';

export const Bookmark: React.FC<{
  size: number;
  title: string;
  onClick?: () => void;
  color?: string;
  outline?: boolean;
}> = ({ size: height, title, onClick, color, outline }) => {
  const width = (height * 14.0) / 18;
  const col = color ?? colorScheme.primary.dark;
  return (
    <svg width={width + 'px'} height={height + 'px'} viewBox="0 0 14.5 18" onClick={onClick}>
      <title>{title}</title>
      <path
        d="M14,2 L14,18 L7,15 L0,18 L0.006875,7 L0,7 L0,0 L14,0 L14,2 Z"
        fill={outline ? `${col}77` : col}
        stroke={outline ? col : undefined}
        strokeWidth={outline ? 1 : undefined}
      />
    </svg>
  );
};
