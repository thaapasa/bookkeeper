import { Box, Flex, Loader, Stack, Table } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useParams } from 'react-router';

import { ExpenseGroupingWithExpenses } from 'shared/types';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { useUserData } from 'client/data/SessionStore';

import { Subtitle } from '../design/Text';
import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { ErrorView } from '../general/ErrorView';
import { TotalsView } from '../search/TotalsView';
import { GroupingCategoryChart } from './GroupingCategoryChart';

export const GroupingExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { groupingId } = useParams<'groupingId'>();
  const numericId = Number(groupingId);
  const { data, isLoading, error } = useQuery({
    queryKey: QueryKeys.groupings.expenses(numericId),
    queryFn: () => apiConnect.getExpenseGroupingWithExpenses(numericId),
    enabled: !!groupingId,
  });
  const reloadExpenses = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: QueryKeys.groupings.expenses(numericId) }),
    [queryClient, numericId],
  );
  return (
    <Flex direction="column" align="center">
      {isLoading ? (
        <Loader />
      ) : error ? (
        <ErrorView title="Virhe tietojen latauksessa">{String(error)}</ErrorView>
      ) : data ? (
        <GroupingExpensesRenderer data={data} reloadExpenses={reloadExpenses} />
      ) : null}
    </Flex>
  );
};

const GroupingExpensesRenderer: React.FC<{
  data: ExpenseGroupingWithExpenses;
  reloadExpenses: () => void;
}> = ({ data, reloadExpenses }) => {
  const userData = useUserData()!;
  return (
    <Flex direction="column" w="100%" mih="calc(100vh - 56px)">
      <Stack align="center">
        <Subtitle w="100%" p="xs" ta="center">
          {data.title}
        </Subtitle>
        <GroupingCategoryChart totals={data.categoryTotals} />
        <ExpenseTableLayout padded>
          <Table.Tbody>
            {data.expenses?.map(expense => (
              <ExpenseRow
                expense={expense}
                userData={userData}
                key={'expense-row-' + expense.id}
                addFilter={noop}
                onUpdated={reloadExpenses}
              />
            ))}
          </Table.Tbody>
        </ExpenseTableLayout>
      </Stack>
      <Box flex={1} />
      <TotalsView results={data.expenses} />
    </Flex>
  );
};
