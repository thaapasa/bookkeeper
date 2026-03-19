import { css } from '@emotion/react';
import styled from '@emotion/styled';

import { colorScheme } from '../Colors';

export const TitleCss = css`
  font: 26pt Oswald;
  font-weight: 300;
`;

export const Title = styled.div`
  border-bottom: 1px solid ${colorScheme.gray.standard};
  font: 26pt Oswald;
  font-weight: 300;
  margin-bottom: 16px;
`;

export const Subtitle = styled.div`
  border-bottom: 1px solid ${colorScheme.gray.light};
  font: 18pt Oswald;
  font-weight: 300;
  margin-bottom: 8px;

  &.small {
    font-size: 16pt;
  }
`;

export const Text = styled.div`
  font-size: 11pt;
`;
