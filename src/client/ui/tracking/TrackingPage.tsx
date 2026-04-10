import { ActionIcon, Box, Loader, Stack } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';

import { Title } from '../design/Text';
import { ErrorView } from '../general/ErrorView';
import { Icons } from '../icons/Icons';
import { newTrackingSubject, TrackingEditor } from './TrackingEditor';
import { TrackingSubjectsList } from './TrackingSubjectView';

export const TrackingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
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
        {isLoading ? (
          <Loader />
        ) : error ? (
          <ErrorView title="Virhe tietojen latauksessa">{String(error)}</ErrorView>
        ) : data ? (
          <TrackingSubjectsList data={data} onReload={invalidateTracking} />
        ) : null}
      </Stack>
      <TrackingEditor reloadAll={invalidateTracking} />
    </>
  );
};
