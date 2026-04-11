import { ActionIcon, Box, Stack } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';

import { Title } from '../design/Text';
import { Icons } from '../icons/Icons';
import { newTrackingSubject, TrackingEditor } from './TrackingEditor';
import { TrackingSubjectsList } from './TrackingSubjectView';

export const TrackingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.tracking.list,
    queryFn: () => apiConnect.getTrackingSubjects(),
  });
  const invalidateTracking = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: QueryKeys.tracking.all }),
    [queryClient],
  );
  return (
    <>
      <Stack gap="md" w="100%" px="md" pb="xl">
        <Box pos="relative" mt="md">
          <Title>Seuranta</Title>
          <Box pos="absolute" right={0} bottom="var(--mantine-spacing-lg)">
            <ActionIcon title="Uusi seuranta" onClick={newTrackingSubject}>
              <Icons.AddChart />
            </ActionIcon>
          </Box>
        </Box>
        <TrackingSubjectsList data={data} onReload={invalidateTracking} />
      </Stack>
      <TrackingEditor reloadAll={invalidateTracking} />
    </>
  );
};
