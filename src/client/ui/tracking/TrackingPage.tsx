import { ActionIcon, Box, Flex, Stack } from '@mantine/core';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';

import { AsyncDataView } from '../component/AsyncDataView';
import { Title } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { Icons } from '../icons/Icons';
import { newTrackingSubject, TrackingEditor } from './TrackingEditor';
import { TrackingSubjectsList } from './TrackingSubjectView';

export const TrackingPage: React.FC = () => {
  const { counter, forceReload } = useForceReload();
  const trackedSubjects = useAsyncData(loadSubjects, true, counter);
  return (
    <Flex direction="column" align="center">
      <Stack gap="md" w="100%" px="md" pb="xl">
        <Box pos="relative" mt="md">
          <Title>Seuranta</Title>
          <Box pos="absolute" right={0} bottom="md">
            <ActionIcon title="Uusi seuranta" onClick={newTrackingSubject}>
              <Icons.AddChart />
            </ActionIcon>
          </Box>
        </Box>
        <AsyncDataView
          data={trackedSubjects}
          renderer={TrackingSubjectsList}
          onReload={forceReload}
        />
      </Stack>
      <TrackingEditor reloadAll={forceReload} />
    </Flex>
  );
};

function loadSubjects(_counter: number) {
  return apiConnect.getTrackingSubjects();
}
