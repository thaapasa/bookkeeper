import { Box, BoxProps } from '@mantine/core';
import * as React from 'react';

import { Icons } from 'client/ui/icons/Icons';
import { QuestionBookmark } from 'client/ui/icons/QuestionBookmark';

import classes from './ExpenseRow.module.css';

export const RecurringExpenseIcon: React.FC = () => (
  <Box display="inline-flex" title="Toistuva kirjaus">
    <Icons.Recurring style={{ width: 16, height: 16, color: 'var(--mantine-color-primary-5)' }} />
  </Box>
);

export const IconToolArea: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Box pos="absolute" top={0} right={16} h={24} className={classes.iconToolArea}>
    {children}
  </Box>
);

export const UnconfirmedIcon: React.FC<
  {
    size?: number;
    title?: string;
    onClick?: () => void;
  } & BoxProps
> = ({ size, title, onClick, style, ...props }) => (
  <Box title={title} onClick={onClick} style={{ ...style, cursor: 'pointer' }} {...props}>
    <QuestionBookmark size={size || 24} title={title ?? 'Alustava kirjaus'} />
  </Box>
);
