import { Tooltip, UnstyledButton, UnstyledButtonProps } from '@mantine/core';
import * as React from 'react';

import { sourceDisplayName } from 'shared/source';
import { Source } from 'shared/types';
import { useValidSession } from 'client/data/SessionStore';

import styles from './ExpenseRowComponents.module.css';

export const SourceIcon: React.FC<
  {
    source: Source;
    onClick?: () => void;
  } & TextButtonProps
> = ({ source, onClick, ...props }) => {
  const ownUserId = useValidSession().user.id;
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
    <Tooltip label={sourceDisplayName(source, ownUserId)}>
      <TextButton key={source.id} onClick={onClick} {...props}>
        {content}
      </TextButton>
    </Tooltip>
  );
};

type TextButtonProps = { onClick?: () => void } & UnstyledButtonProps;

export const TextButton: React.FC<React.PropsWithChildren<TextButtonProps>> = ({
  children,
  onClick,
  ...props
}) => (
  <UnstyledButton fz="inherit" className={styles.textButton} onClick={onClick} {...props}>
    {children}
  </UnstyledButton>
);
