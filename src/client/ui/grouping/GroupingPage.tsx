import { ActionIcon, Box, Flex, Loader, Stack } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';

import { Title } from '../design/Text';
import { ErrorView } from '../general/ErrorView';
import { Icons } from '../icons/Icons';
import { ExpenseGroupingsList } from './ExpenseGroupingsView';
import { GroupingEditor, newExpenseGrouping } from './GroupingEditor';

export const GroupingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    data: groupings,
    isLoading,
    error,
  } = useQuery({
    queryKey: QueryKeys.groupings.list,
    queryFn: () => apiConnect.getExpenseGroupings(),
  });
  const { data: tags } = useQuery({
    queryKey: QueryKeys.groupings.tags,
    queryFn: () => apiConnect.getExpenseGroupingTags(),
  });
  const invalidateGroupings = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: QueryKeys.groupings.all }),
    [queryClient],
  );
  return (
    <Flex direction="column" align="center">
      <Stack gap="md" w="100%" px="md" pb="xl">
        <Box pos="relative" mt="md">
          <Title>Ryhmittelyt</Title>
          <Box pos="absolute" right={0} bottom="var(--mantine-spacing-lg)">
            <ActionIcon title="Uusi ryhmittely" onClick={newExpenseGrouping}>
              <Icons.AddChart />
            </ActionIcon>
          </Box>
        </Box>
        {isLoading ? (
          <Loader />
        ) : error ? (
          <ErrorView title="Virhe tietojen latauksessa">{String(error)}</ErrorView>
        ) : groupings ? (
          <ExpenseGroupingsList
            data={groupings}
            onReload={invalidateGroupings}
            allTags={tags ?? []}
          />
        ) : null}
      </Stack>
      <GroupingEditor reloadAll={invalidateGroupings} />
    </Flex>
  );
};
