import { Box, BoxProps } from '@mantine/core';
import * as React from 'react';

import { spaced } from 'shared/util';

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
  <Box
    className={spaced`${className} ${styles.container} ${compact ? styles.compact : ''} ${fullWidth ? styles.fullWidth : ''} ${noMargin ? styles.noMargin : ''}`}
    {...props}
  >
    {title ? (
      <Box
        className={spaced`${styles.titleBase} ${type === 'warning' ? styles.warningTitle : styles.noteTitle}`}
      >
        {title}
      </Box>
    ) : null}
    <Box p="md">{children}</Box>
  </Box>
);
