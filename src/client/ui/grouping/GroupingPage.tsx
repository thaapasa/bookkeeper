import { ActionIcon, Stack } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';

import { PageTitle } from '../design/PageTitle';
import { Icons } from '../icons/Icons';
import { PageLayout } from '../layout/PageLayout';
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
      <PageLayout>
        <Stack gap="md" w="100%">
          <PageTitle
            tools={
              <ActionIcon title="Uusi ryhmittely" onClick={newExpenseGrouping}>
                <Icons.AddChart />
              </ActionIcon>
            }
          >
            Ryhmittelyt
          </PageTitle>
          <ExpenseGroupingsList
            data={groupings}
            onReload={invalidateGroupings}
            allTags={tags ?? []}
          />
        </Stack>
      </PageLayout>
      <GroupingEditor reloadAll={invalidateGroupings} />
    </>
  );
};
