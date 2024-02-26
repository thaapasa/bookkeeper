import * as React from 'react';

import { colorScheme } from '../Colors';

export const Bookmark: React.FC<{
  size: number;
  title: string;
  onClick?: () => void;
  color?: string;
}> = ({ size: height, title, onClick, color }) => {
  const width = (height * 14.0) / 18;
  return (
    <svg width={width + 'px'} height={height + 'px'} viewBox="0 0 14 18" onClick={onClick}>
      <title>{title}</title>
      <path
        d="M14,2 L14,18 L7,15 L0,18 L0.006875,7 L0,7 L0,0 L14,0 L14,2 Z"
        fill={color ?? colorScheme.primary.dark}
      />
    </svg>
  );
};
