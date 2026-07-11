import { Stack, Table, Text } from '@mantine/core';
import { useSuspenseQuery } from '@tanstack/react-query';
import * as React from 'react';

import {
  createYearlySummaryChartData,
  YearlyChartRow,
} from 'shared/statistics/YearlySummaryChartData';
import { apiConnect } from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { useCategoryMap } from 'client/data/SessionStore';
import { PageTitle } from 'client/ui/design/PageTitle';

import { formatMoney } from '../chart/Format';
import { NoteView } from '../general/NoteView';
import { PageLayout } from '../layout/PageLayout';
import { YearlySummaryChart } from './YearlySummaryChart';

/**
 * Yearly income vs expense overview: paired stacked bars per year (split by
 * top-level category) and a surplus table. Transfers and categories flagged
 * with excludeFromTotals are filtered out server-side.
 */
export const YearlySummaryView: React.FC = () => {
  const categoryMap = useCategoryMap()!;
  const { data } = useSuspenseQuery({
    queryKey: QueryKeys.statistics.yearlySummary,
    queryFn: apiConnect.loadYearlySummary,
  });
  const chartData = React.useMemo(
    () => (data.rows.length > 0 ? createYearlySummaryChartData(data.rows, categoryMap) : null),
    [data, categoryMap],
  );
  return (
    <PageLayout>
      <PageTitle>Vuosikatsaus</PageTitle>
      {chartData ? (
        <Stack gap="lg" mt="md">
          <YearlySummaryChart data={chartData} />
          <SurplusTable years={chartData.years} />
        </Stack>
      ) : (
        <NoteView title="Ei tietoja">Ei kirjauksia valitulla aikavälillä</NoteView>
      )}
    </PageLayout>
  );
};

const SurplusTable: React.FC<{ years: YearlyChartRow[] }> = ({ years }) => (
  <Table maw={480} verticalSpacing={4} withRowBorders={false}>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Vuosi</Table.Th>
        <Table.Th ta="right">Tulot</Table.Th>
        <Table.Th ta="right">Menot</Table.Th>
        <Table.Th ta="right">Säästö</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
      {years.map(y => (
        <Table.Tr key={y.year}>
          <Table.Td>{y.year}</Table.Td>
          <Table.Td ta="right">{formatMoney(y.income)}</Table.Td>
          <Table.Td ta="right">{formatMoney(y.expense)}</Table.Td>
          <Table.Td ta="right">
            <Text span fz="sm" fw={600} c={y.surplus >= 0 ? 'teal.7' : 'pink.7'}>
              {formatMoney(y.surplus)}
            </Text>
          </Table.Td>
        </Table.Tr>
      ))}
    </Table.Tbody>
  </Table>
);
