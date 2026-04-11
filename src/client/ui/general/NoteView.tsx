import { Box, BoxProps, Card, CardProps, Group, Text } from '@mantine/core';
import * as React from 'react';

export type NoteType = 'note' | 'warning';
export type NoteViewProps = {
  title?: string;
  type?: NoteType;
  fullWidth?: boolean;
  compact?: boolean;
  noMargin?: boolean;
} & CardProps;

export const NoteView: React.FC<React.PropsWithChildren<NoteViewProps>> = ({
  type,
  title,
  children,
  compact,
  noMargin,
  className,
  ...props
}) => (
  <Card radius="sm" {...props} p={0}>
    {title ? (
      <Group py="xs" px="md" {...NoteColors[type ?? 'note']}>
        <Text fw={500}>{title}</Text>
      </Group>
    ) : null}
    <Box p="md">{children}</Box>
  </Card>
);

const NoteColors: Record<NoteType, Pick<BoxProps, 'c' | 'bg'>> = {
  note: {
    c: 'text',
    bg: 'neutral.4',
  },
  warning: {
    c: 'neutral.1',
    bg: 'primary.7',
  },
};
