import styled from '@emotion/styled';
import { css, Typography } from '@mui/material';

import { colorScheme } from '../Colors';

export const TitleCss = css`
  font: 26pt Oswald;
  font-weight: 300;
`;

export const Title = styled(Typography)`
  border-bottom: 1px solid ${colorScheme.gray.standard};
  font: 26pt Oswald;
  font-weight: 300;
  margin-bottom: 16px;
`;

export const Subtitle = styled(Typography)`
  border-bottom: 1px solid ${colorScheme.gray.light};
  font: 18pt Oswald;
  font-weight: 300;
  margin-bottom: 8px;

  &.small {
    font-size: 16pt;
  }
`;

export const Text = styled(Typography)`
  font-size: 11pt;
`;
