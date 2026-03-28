import { Box, DEFAULT_THEME, Text } from '@mantine/core';
import * as React from 'react';

import { ExpenseGroupingRef } from 'shared/types';

import { getLuminanceSafe } from '../ColorUtils';
import { Bookmark } from '../icons/Bookmark';

const defaultGroupingColor = DEFAULT_THEME.colors.blue[3];

type GroupedExpenseIconProps = {
  size?: number;
  grouping: ExpenseGroupingRef;
  onClick?: () => void;
  className?: string;
  implicit?: boolean;
};

export const GroupedExpenseIcon: React.FC<GroupedExpenseIconProps> = ({
  size,
  grouping,
  onClick,
  className,
  implicit,
}) => {
  const color = grouping.color ?? defaultGroupingColor;
  const luminance = getLuminanceSafe(color);

  return (
    <Box
      title={grouping.title}
      onClick={onClick}
      className={className}
      pos="relative"
      display="inline-block"
      style={{ cursor: 'pointer' }}
    >
      <Bookmark size={size || 24} title={grouping.title} color={color} outline={implicit} />
      {grouping.title ? (
        <Box
          pos="absolute"
          left={0}
          right={0}
          top={3}
          display="inline-flex"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            color: luminance > 0.4 ? 'black' : 'white',
          }}
        >
          <Text span fz="xs" fw={700}>
            {grouping.title[0]}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
};
