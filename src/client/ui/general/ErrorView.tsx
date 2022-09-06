import * as React from 'react';
import styled from 'styled-components';

import { colorScheme } from '../Colors';

export const ErrorView: React.FC<
  React.PropsWithChildren<{ title: string }>
> = ({ title, children }) => (
  <Container>
    <Title>{title}</Title>
    <Message>{children}</Message>
  </Container>
);

export const PathNotFoundError: React.FC = () => (
  <ErrorView title="Hups">
    Tämä polku ei johda mihinkään. Palaa tästä <a href="/">etusivulle</a>!
  </ErrorView>
);

const Container = styled.div`
  margin: 32px;
`;

const Title = styled.div`
  padding: 8px 16px;
  font-size: 18px;
  background-color: ${colorScheme.secondary.dark};
  color: ${colorScheme.gray.light};
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
`;

const Message = styled.div`
  padding: 16px;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  background-color: ${colorScheme.primary.standard};
`;
