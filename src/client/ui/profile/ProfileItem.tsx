import styled from '@emotion/styled';
import { Grid } from '@mui/material';
import React from 'react';

import { Text } from '../design/Text';

export const ProfileItem: React.FC<React.PropsWithChildren<{ title?: string }>> = ({
  title,
  children,
}) => (
  <>
    <Grid item xs={3} alignSelf="center">
      <Text>{title}</Text>
    </Grid>
    <DataItemGrid item xs={9} alignSelf="center">
      {children}
    </DataItemGrid>
  </>
);

const DataItemGrid = styled(Grid)`
  & > div,
  & > button {
    margin-left: 16px;
  }
  & > div:first-of-type,
  & > button:first-of-type {
    margin-left: inherit !important;
  }
`;
