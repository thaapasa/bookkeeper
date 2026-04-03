import { ActionIcon, Box, Group, Paper, SimpleGrid } from '@mantine/core';
import React from 'react';

import { ObjectId, TrackingSubject, TrackingSubjectWithData } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Subtitle } from '../design/Text';
import { Icons } from '../icons/Icons';
import { TrackingChart } from './TrackingChartRenderer';
import { editTrackingSubject } from './TrackingEditor';

export const TrackingSubjectsList: React.FC<{
  data: TrackingSubjectWithData[];
  onReload: () => void;
}> = ({ data, onReload }) => {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" w="100%">
      {data.map(d => (
        <TrackingSubjectView subject={d} key={d.id} onReload={onReload} />
      ))}
    </SimpleGrid>
  );
};

export const TrackingSubjectView: React.FC<{
  subject: TrackingSubjectWithData;
  onReload: () => void;
}> = ({ subject, onReload }) => {
  return (
    <Paper
      w="100%"
      pos="relative"
      h={200}
      bg="neutral.2"
      shadow="md"
      radius="md"
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <Box h={32} pos="relative" bg="neutral.1" style={{ zIndex: 1 }}>
        <Subtitle order={3} pl="sm" pt={2} fw={700} style={{ border: 'none' }}>
          {subject.title}
        </Subtitle>
        <Group pos="absolute" right={0} top={0} gap={2} style={{ zIndex: 2 }}>
          <ActionIcon
            size="sm"
            title="Vaihda värejä"
            onClick={() => changeTrackingColors(subject.id, onReload)}
          >
            <Icons.Palette fontSize="small" />
          </ActionIcon>
          <ActionIcon
            size="sm"
            title="Muokkaa seurantaa"
            onClick={() => editTrackingSubject(subject.id)}
          >
            <Icons.Edit fontSize="small" />
          </ActionIcon>
          <ActionIcon size="sm" onClick={() => deleteSubject(subject, onReload)}>
            <Icons.Delete fontSize="small" />
          </ActionIcon>
        </Group>
      </Box>
      <Group flex={1} wrap="nowrap" pos="relative">
        {subject.image ? (
          <img src={subject.image} alt="" style={{ width: 168, height: 168 }} />
        ) : null}
        <TrackingChart data={subject.data} trackingData={subject.trackingData} />
      </Group>
    </Paper>
  );
};

async function deleteSubject(subject: TrackingSubject, onReload: () => void) {
  await executeOperation(() => apiConnect.deleteTrackingSubject(subject.id), {
    confirm: `Haluatko varmasti poistaa seurannan '${subject.title}'?`,
    success: 'Seuranta poistettu!',
    postProcess: onReload,
  });
}

async function changeTrackingColors(subjectId: ObjectId, onReload: () => void) {
  await executeOperation(() => apiConnect.changeTrackingColors(subjectId), {
    postProcess: onReload,
  });
}
