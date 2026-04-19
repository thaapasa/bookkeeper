import { Stack, Table } from '@mantine/core';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
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
import { PageLayout } from '../layout/PageLayout';
import { TotalsView } from '../search/TotalsView';
import { GroupingCategoryChart } from './GroupingCategoryChart';

export const GroupingExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { groupingId } = useParams<'groupingId'>();
  const numericId = Number(groupingId);
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.groupings.expenses(numericId),
    queryFn: () => apiConnect.getExpenseGroupingWithExpenses(numericId),
  });
  const reloadExpenses = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: QueryKeys.groupings.expenses(numericId) }),
    [queryClient, numericId],
  );
  return <GroupingExpensesRenderer data={data} reloadExpenses={reloadExpenses} />;
};

const GroupingExpensesRenderer: React.FC<{
  data: ExpenseGroupingWithExpenses;
  reloadExpenses: () => void;
}> = ({ data, reloadExpenses }) => {
  const userData = useUserData()!;
  return (
    <PageLayout footer={<TotalsView results={data.expenses} />}>
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
    </PageLayout>
  );
};
