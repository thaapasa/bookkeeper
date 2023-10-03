import { css } from '@emotion/react';

export const checkersBackground = ({
  color = '#cccccc',
  size = 8,
}: {
  color?: string;
  size: number;
}) => css`
  background-image: linear-gradient(45deg, ${color} 25%, transparent 25%),
    linear-gradient(-45deg, ${color} 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, ${color} 75%),
    linear-gradient(-45deg, transparent 75%, ${color} 75%);
  background-size: ${size * 2}px ${size * 2}px;
  background-position:
    0 0,
    0 ${size}px,
    ${size}px -${size}px,
    -${size}px 0px;
`;
