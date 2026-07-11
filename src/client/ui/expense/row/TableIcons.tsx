import { Box, BoxProps, Tooltip } from '@mantine/core';
import * as React from 'react';

import { BookmarkIcon } from 'client/ui/component/BookmarkIcon';
import { Icons } from 'client/ui/icons/Icons';

export const RecurringExpenseIcon: React.FC<BoxProps> = props => (
  <Box display="inline-flex" {...props}>
    <Tooltip label="Toistuva kirjaus">
      <Icons.Recurring size={16} color="var(--mantine-color-primary-5)" />
    </Tooltip>
  </Box>
);

/**
 * Dim link marker shown in the empty date slot of a split group's continuation
 * rows, tying them to the group's first row. Neutral-6: dimmer than text
 * (neutral 7-9), stronger than borders (neutral 3-5).
 */
export const SplitLinkIcon: React.FC<BoxProps> = props => (
  <Box display="inline-flex" {...props}>
    <Tooltip label="Pilkottu samasta kirjauksesta">
      <Icons.Link size={14} color="var(--mantine-color-neutral-6)" />
    </Tooltip>
  </Box>
);

export const UnconfirmedIcon: React.FC<
  {
    size?: number;
    title?: string;
    onClick?: () => void;
  } & BoxProps
> = ({ title, onClick, style, fz, ...props }) => (
  <BookmarkIcon
    onClick={onClick}
    color="var(--mantine-color-primary-5)"
    symbol="?"
    tooltip={title ?? 'Alustava kirjaus'}
    fz={fz || 'sm'}
    {...props}
  />
);
