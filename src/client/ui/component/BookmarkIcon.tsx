import { Box, BoxProps, Flex, Text, Tooltip } from '@mantine/core';
import * as React from 'react';

import { Icons } from '../icons/Icons';

export type BookmarkIconProps = {
  size?: number;
  onClick?: () => void;
  color?: string;
  symbol?: string;
  tooltip?: string;
} & Omit<BoxProps, 'size' | 'onClick'>;

export const BookmarkIcon: React.FC<BookmarkIconProps> = ({
  onClick,
  size = 24,
  c,
  color,
  style,
  symbol,
  tooltip,
  fz,
  ...props
}) => {
  const icon = (
    <Box
      onClick={onClick}
      pos="relative"
      style={onClick ? { cursor: 'pointer', ...style } : style}
      {...props}
    >
      <Icons.Bookmark size={size} color={color} />
      {symbol ? (
        <Flex pos="absolute" left={0} right={0} top={0} bottom={7} justify="center" align="center">
          <Text span fz={fz || 'xs'} fw={700} c={c || color}>
            {symbol}
          </Text>
        </Flex>
      ) : null}
    </Box>
  );
  return tooltip ? <Tooltip label={tooltip}>{icon}</Tooltip> : icon;
};
