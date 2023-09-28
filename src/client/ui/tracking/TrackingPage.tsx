import { Grid } from '@mui/material';
import React from 'react';

import { Title } from '../design/Text';
import { PageContentContainer } from '../Styles';

export const TrackingPage: React.FC = () => {
  return (
    <PageContentContainer className="center">
      <Grid container columnSpacing={2} rowSpacing={2} padding={2} maxWidth={800}>
        <Grid item xs={12}>
          <Title>Seuranta</Title>
        </Grid>
      </Grid>
    </PageContentContainer>
  );
};
