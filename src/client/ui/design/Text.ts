import styled from '@emotion/styled';
import { Typography } from '@mui/material';

import { colorScheme } from '../Colors';

export const Title = styled(Typography)`
  border-bottom: 1px solid ${colorScheme.gray.standard};
  font: 26pt Oswald;
  font-weight: 300;
  margin-bottom: 16px;
`;

export const Text = styled(Typography)`
  font-size: 11pt;
`;
