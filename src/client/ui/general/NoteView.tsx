import { styled } from '@mui/system';
import * as React from 'react';

import { spaced } from 'shared/util';

import { colorScheme } from '../Colors';

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
  background-color: ${colorScheme.primary.standard};
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
  font-size: 18px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;

  &.note {
    color: ${colorScheme.primary.text};
    background-color: ${colorScheme.primary.dark};
  }
  &.warning {
    color: ${colorScheme.gray.light};
    background-color: ${colorScheme.secondary.dark};
  }
`;

const Message = styled('div')`
  padding: 16px;
`;
