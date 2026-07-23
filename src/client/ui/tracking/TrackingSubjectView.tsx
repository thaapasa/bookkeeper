import { ActionIcon, Card, Group, SimpleGrid } from '@mantine/core';
import React from 'react';

import { ObjectId, TrackingSubject, TrackingSubjectWithData } from 'shared/types';
import { apiConnect } from 'client/data/ApiConnect';
import { executeOperation } from 'client/util/ExecuteOperation';

import { Subtitle } from '../design/Text';
import { Icons } from '../icons/Icons';
import { CHART_HEIGHT, TrackingChart } from './TrackingChartRenderer';
import { editTrackingSubject } from './TrackingEditor';

export const TrackingSubjectsList: React.FC<{
  data: TrackingSubjectWithData[];
  onReload: () => void;
}> = ({ data, onReload }) => {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" w="100%">
      {data.map((d, i) => (
        <TrackingSubjectView
          subject={d}
          key={d.id}
          onReload={onReload}
          // The last grid row has little space below it, so grow the tooltips upwards there
          growTooltipUp={i >= data.length - 2}
        />
      ))}
    </SimpleGrid>
  );
};

export const TrackingSubjectView: React.FC<{
  subject: TrackingSubjectWithData;
  onReload: () => void;
  growTooltipUp?: boolean;
}> = ({ subject, onReload, growTooltipUp }) => {
  return (
    // overflow: visible lets chart tooltips extend past the card bounds
    <Card
      w="100%"
      pos="relative"
      bg="surface.1"
      shadow="md"
      radius="md"
      m={0}
      p={0}
      style={{ overflow: 'visible' }}
    >
      <Group
        pos="relative"
        bg="surface.2"
        align="center"
        justify="space-between"
        style={{
          borderTopLeftRadius: 'var(--mantine-radius-md)',
          borderTopRightRadius: 'var(--mantine-radius-md)',
        }}
      >
        <Subtitle noBorder order={4} px="md" fw={700} py="sm">
          {subject.title}
        </Subtitle>
        <Group gap="xs" px="sm">
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
      </Group>
      <Group wrap="nowrap" pos="relative">
        {subject.image ? (
          <img
            src={subject.image}
            alt=""
            style={{
              width: CHART_HEIGHT,
              height: CHART_HEIGHT,
              borderBottomLeftRadius: 'var(--mantine-radius-md)',
            }}
          />
        ) : null}
        <TrackingChart
          data={subject.data}
          trackingData={subject.trackingData}
          growTooltipUp={growTooltipUp}
        />
      </Group>
    </Card>
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
