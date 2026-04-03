import { Box, BoxProps, Group, Stack, Text } from '@mantine/core';
import * as React from 'react';

import { classNames } from '../utils/classNames.ts';
import styles from './NoteView.module.css';

export type NoteType = 'note' | 'warning';
export type NoteViewProps = {
  title?: string;
  type?: NoteType;
  fullWidth?: boolean;
  compact?: boolean;
  noMargin?: boolean;
} & BoxProps;

export const NoteView: React.FC<React.PropsWithChildren<NoteViewProps>> = ({
  type,
  title,
  children,
  compact,
  fullWidth,
  noMargin,
  className,
  ...props
}) => (
  <Stack
    className={classNames(className, styles.container, fullWidth ? styles.fullWidth : undefined)}
    bg="neutral.2"
    {...props}
  >
    {title ? (
      <Group
        className={styles.titleBase}
        py="xs"
        px="md"
        my={noMargin ? 0 : compact ? 'xs' : 'xl'}
        mx={noMargin ? 0 : compact ? 'md' : 'xl'}
        {...NoteColors[type ?? 'note']}
      >
        <Text fw={500}>{title}</Text>
      </Group>
    ) : null}
    <Box p="md">{children}</Box>
  </Stack>
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
