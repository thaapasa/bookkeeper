import { Box, Flex, Stack, Table } from '@mantine/core';
import React from 'react';
import { useParams } from 'react-router';

import { ExpenseGroupingWithExpenses } from 'shared/types';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { userDataP } from 'client/data/Categories';
import { needUpdateE } from 'client/data/State';

import { AsyncDataView } from '../component/AsyncDataView';
import { Subtitle } from '../design/Text';
import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { useAsyncData } from '../hooks/useAsyncData';
import { useBaconProperty } from '../hooks/useBaconState';
import { useForceReload } from '../hooks/useForceReload.ts';
import { TotalsView } from '../search/TotalsView';
import { GroupingCategoryChart } from './GroupingCategoryChart';

export const GroupingExpensesPage: React.FC = () => {
  const { counter, forceReload } = useForceReload();
  const { groupingId } = useParams<'groupingId'>();
  const expenses = useAsyncData(loadExpenses, !!groupingId, Number(groupingId), counter);
  React.useEffect(() => needUpdateE.onValue(forceReload), [forceReload]);
  return (
    <Flex direction="column" align="center">
      <AsyncDataView
        data={expenses}
        renderer={GroupingExpensesRenderer}
        reloadExpenses={forceReload}
      />
    </Flex>
  );
};

const loadExpenses = (groupingId: number, _counter: number) =>
  apiConnect.getExpenseGroupingWithExpenses(Number(groupingId));

const GroupingExpensesRenderer: React.FC<{
  data: ExpenseGroupingWithExpenses;
  reloadExpenses: () => void;
}> = ({ data, reloadExpenses }) => {
  const userData = useBaconProperty(userDataP);
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
