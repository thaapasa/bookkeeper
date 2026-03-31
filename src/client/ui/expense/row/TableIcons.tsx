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
