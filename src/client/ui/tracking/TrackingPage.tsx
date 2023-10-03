import styled from '@emotion/styled';
import { Grid, IconButton } from '@mui/material';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';

import { AsyncDataView } from '../component/AsyncDataView';
import { Title } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { PageContentContainer } from '../Styles';
import { newTrackingSubject, TrackingEditor } from './TrackingEditor';
import { TrackingSubjectsList } from './TrackingSubjectView';

export const TrackingPage: React.FC = () => {
  const { counter, forceReload } = useForceReload();
  const trackedSubjects = useAsyncData(loadSubjects, true, counter);
  return (
    <PageContentContainer className="center">
      <Grid container columnSpacing={2} rowSpacing={2} padding={2}>
        <RGrid item xs={12}>
          <Title>Seuranta</Title>
          <ToolArea>
            <IconButton title="Uusi seuranta" onClick={newTrackingSubject}>
              <Icons.AddChart />
            </IconButton>
          </ToolArea>
        </RGrid>
        <AsyncDataView
          data={trackedSubjects}
          renderer={TrackingSubjectsList}
          onReload={forceReload}
        />
      </Grid>
      <TrackingEditor reloadAll={forceReload} />
    </PageContentContainer>
  );
};

function loadSubjects(_counter: number) {
  return apiConnect.getTrackingSubjects();
}

const RGrid = styled(Grid)`
  position: relative;
`;

const ToolArea = styled('div')`
  position: absolute;
  right: 0;
  bottom: 16px;
`;
