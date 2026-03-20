import styled from '@emotion/styled';
import * as React from 'react';

import { spaced } from 'shared/util';

import { neutral, primary, text } from '../Colors';

export type NoteType = 'note' | 'warning';
export type NoteViewProps = {
  title?: string;
  type?: NoteType;
  className?: string;
  fullWidth?: boolean;
  compact?: boolean;
};

export const NoteView: React.FC<React.PropsWithChildren<NoteViewProps>> = ({
  type,
  title,
  children,
  className,
  compact,
  fullWidth,
}) => (
  <Container
    className={spaced`${className} ${compact ? 'compact' : ''} ${fullWidth ? 'fullWidth' : ''}`}
  >
    {title ? <Title className={type ?? 'note'}>{title}</Title> : null}
    <Message>{children}</Message>
  </Container>
);

const Container = styled('div')`
  background-color: ${neutral[2]};
  border-radius: 4px;
  margin: 32px;
  width: auto;
  box-sizing: border-box;

  &.nomargin {
    margin: 0;
  }

  &.compact {
    margin: 8px 16px;
  }

  &.fullWidth {
    display: flex;
    flex-direction: column;
    align-self: stretch;
  }
`;

const Title = styled('div')`
  padding: 8px 16px;
  font-size: var(--mantine-font-size-lg);
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;

  &.note {
    color: ${text};
    background-color: ${neutral[4]};
  }
  &.warning {
    color: ${neutral[1]};
    background-color: ${primary[7]};
  }
`;

const Message = styled('div')`
  padding: 16px;
`;
