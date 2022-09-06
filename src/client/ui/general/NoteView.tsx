import * as React from 'react';
import styled from 'styled-components';

import { colorScheme } from '../Colors';

export type NoteType = 'note' | 'warning';
export type NoteViewProps = {
  title?: string;
  type?: NoteType;
  className?: string;
};

export const NoteView: React.FC<React.PropsWithChildren<NoteViewProps>> = ({
  type,
  title,
  children,
  className,
}) => (
  <Container className={className}>
    {title ? <Title className={type ?? 'note'}>{title}</Title> : null}
    <Message>{children}</Message>
  </Container>
);

const Container = styled.div`
  background-color: ${colorScheme.primary.standard};
  border-radius: 4px;
  margin: 32px;
  width: auto;
  box-sizing: border-box;

  &.nomargin {
    margin: 0;
  }
`;

const Title = styled.div`
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

const Message = styled.div`
  padding: 16px;
`;
