import { ActionIcon, Box, Stack } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';

import { Title } from '../design/Text';
import { Icons } from '../icons/Icons';
import { ExpenseGroupingsList } from './ExpenseGroupingsView';
import { GroupingEditor, newExpenseGrouping } from './GroupingEditor';

export const GroupingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: groupings } = useSuspenseQuery({
    queryKey: QueryKeys.groupings.list,
    queryFn: () => apiConnect.getExpenseGroupings(),
  });
  const { data: tags } = useSuspenseQuery({
    queryKey: QueryKeys.groupings.tags,
    queryFn: () => apiConnect.getExpenseGroupingTags(),
  });
  const invalidateGroupings = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: QueryKeys.groupings.all }),
    [queryClient],
  );
  return (
    <>
      <Stack gap="md" w="100%" px={{ base: 'md', sm: 'lg' }} pb="xl">
        <Box pos="relative" mt="md">
          <Title>Ryhmittelyt</Title>
          <Box pos="absolute" right={0} bottom="var(--mantine-spacing-lg)">
            <ActionIcon title="Uusi ryhmittely" onClick={newExpenseGrouping}>
              <Icons.AddChart />
            </ActionIcon>
          </Box>
        </Box>
        <ExpenseGroupingsList
          data={groupings}
          onReload={invalidateGroupings}
          allTags={tags ?? []}
        />
      </Stack>
      <GroupingEditor reloadAll={invalidateGroupings} />
    </>
  );
};
