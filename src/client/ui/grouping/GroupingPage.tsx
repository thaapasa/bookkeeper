import { ActionIcon, Box, Flex, Stack } from '@mantine/core';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';

import { AsyncDataView } from '../component/AsyncDataView';
import { Title } from '../design/Text';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload.ts';
import { Icons } from '../icons/Icons';
import { ExpenseGroupingsList } from './ExpenseGroupingsView';
import { GroupingEditor, newExpenseGrouping } from './GroupingEditor';

export const GroupingPage: React.FC = () => {
  const { counter, forceReload } = useForceReload();
  const expenseGroupings = useAsyncData(loadGroupings, true, counter);
  const tags = useAsyncData(loadTags, true, counter);
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
        <AsyncDataView
          data={expenseGroupings}
          renderer={ExpenseGroupingsList}
          onReload={forceReload}
          allTags={tags.type === 'loaded' ? tags.value : []}
        />
      </Stack>
      <GroupingEditor reloadAll={forceReload} />
    </Flex>
  );
};

function loadGroupings(_counter: number) {
  return apiConnect.getExpenseGroupings();
}

function loadTags(_counter: number) {
  return apiConnect.getExpenseGroupingTags();
}
