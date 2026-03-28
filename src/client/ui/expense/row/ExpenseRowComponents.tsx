import { UnstyledButton } from '@mantine/core';
import * as React from 'react';

import { Source } from 'shared/types';

import styles from './ExpenseRowComponents.module.css';

export const SourceIcon: React.FC<{
  source: Source;
  onClick?: () => void;
}> = ({ source, onClick }) => {
  const content = source.image ? (
    <img
      src={source.image}
      title={source.name}
      style={{ maxWidth: 40, maxHeight: 28 }}
      alt={source.name}
    />
  ) : source.abbreviation ? (
    source.abbreviation
  ) : (
    source.name
  );
  return (
    <TextButton key={source.id} onClick={onClick}>
      {content}
    </TextButton>
  );
};

export const TextButton: React.FC<
  React.PropsWithChildren<{ onClick?: () => void; style?: React.CSSProperties }>
> = ({ children, onClick, style }) => (
  <UnstyledButton fz="inherit" className={styles.textButton} onClick={onClick} style={style}>
    {children}
  </UnstyledButton>
);
