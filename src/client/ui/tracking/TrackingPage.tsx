import styled from '@emotion/styled';
import { Grid, IconButton } from '@mui/material';
import React from 'react';

import { Title } from '../design/Text';
import { Icons } from '../icons/Icons';
import { PageContentContainer } from '../Styles';

export const TrackingPage: React.FC = () => {
  return (
    <PageContentContainer className="center">
      <Grid container columnSpacing={2} rowSpacing={2} padding={2} maxWidth={800}>
        <RGrid item xs={12}>
          <Title>Seuranta</Title>
          <ToolArea>
            <IconButton title="Uusi seuranta">
              <Icons.AddChart />
            </IconButton>
          </ToolArea>
        </RGrid>
      </Grid>
    </PageContentContainer>
  );
};

const RGrid = styled(Grid)`
  position: relative;
`;

const ToolArea = styled('div')`
  position: absolute;
  right: 0;
  bottom: 16px;
`;
