import { Box, BoxProps, Group } from '@mantine/core';
import * as React from 'react';

import { Icons } from 'client/ui/icons/Icons';
import { QuestionBookmark } from 'client/ui/icons/QuestionBookmark';

export const RecurringExpenseIcon: React.FC = () => (
  <Box display="inline-flex" title="Toistuva kirjaus">
    <Icons.Recurring style={{ width: 16, height: 16, color: 'var(--mantine-color-primary-5)' }} />
  </Box>
);

export const IconToolArea: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Group pos="absolute" gap="xs" top={0} right={0}>
    {children}
  </Group>
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
