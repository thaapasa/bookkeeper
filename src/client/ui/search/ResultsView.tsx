import { Group, Stack, Table, Text } from '@mantine/core';
import * as React from 'react';

import { calculateTotals, UserExpense } from 'shared/expense';
import { toDateTime } from 'shared/time';
import { Category } from 'shared/types';
import { groupBy, noop, typedKeys } from 'shared/util';
import { UserDataProps } from 'client/data/Categories';
import { useUserData } from 'client/data/SessionStore';

import { SectionLabel } from '../design/Text';
import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { TotalsView } from './TotalsView';

interface ResultsViewOwnProps {
  results: UserExpense[];
  onUpdate: () => void;
  onSelectCategory: (cat: Category) => void;
}

export const ResultsView: React.FC<ResultsViewOwnProps> = ({ results, ...rest }) => {
  const userData = useUserData()!;
  const hasResults = results && results.length > 0;
  return (
    <Stack>
      <Text c="primary.7" mx="lg" my="xs">
        Hakutulokset
      </Text>
      <ResultsContents results={results} userData={userData} {...rest} />
      {hasResults ? <TotalsView results={results} /> : null}
    </Stack>
  );
};

interface ResultsProps extends ResultsViewOwnProps {
  userData: UserDataProps;
}

const ResultsContents: React.FC<ResultsProps> = ({ results, ...rest }) => {
  const resultsByYears: Record<string, UserExpense[]> | undefined =
    results && results.length > 0
      ? groupBy(e => String(toDateTime(e.date).year), results)
      : undefined;

  if (!resultsByYears) {
    return (
      <Text mx="lg" my="xs">
        Ei tuloksia, tarkista hakuehdot
      </Text>
    );
  }
  const years = typedKeys(resultsByYears);
  return (
    <>
      {years.map(y => (
        <ExpenseYear key={y} year={y} results={resultsByYears[y]} {...rest} />
      ))}
    </>
  );
};

const ExpenseYear: React.FC<ResultsProps & { year: string }> = ({ results, year, ...rest }) => (
  <>
    <YearHeader year={year} expenses={results} />
    <ExpenseList results={results} {...rest} />
  </>
);

const ExpenseList: React.FC<ResultsProps> = ({ results, onUpdate, onSelectCategory, userData }) => (
  <ExpenseTableLayout padded>
    <Table.Tbody>
      {results.map(e => (
        <ExpenseRow
          key={e.id}
          expense={e}
          onUpdated={onUpdate}
          addFilter={noop}
          selectCategory={onSelectCategory}
          userData={userData}
        />
      ))}
    </Table.Tbody>
  </ExpenseTableLayout>
);

function YearHeader({ year, expenses }: { year: string; expenses: UserExpense[] }) {
  const totals = calculateTotals(expenses);
  return (
    <Group
      bg="surface.1"
      px="lg"
      py="md"
      w="100%"
      wrap="nowrap"
      style={{ boxSizing: 'border-box' }}
    >
      <Text c="primary.7" flex={1}>
        Vuosi {year}
      </Text>
      <Group gap={0} ml="md" wrap="nowrap">
        <SectionLabel component="span">Yhteensä</SectionLabel>
        <Text component="span" c="primary.9" ml="xs">
          {totals.total.format()}
        </Text>
      </Group>
      <Group gap={0} ml="md" wrap="nowrap">
        <SectionLabel component="span">Tulot</SectionLabel>
        <Text component="span" c="primary.9" ml="xs">
          {totals.income.format()}
        </Text>
      </Group>
      <Group gap={0} ml="md" wrap="nowrap">
        <SectionLabel component="span">Menot</SectionLabel>
        <Text component="span" c="primary.9" ml="xs">
          {totals.expense.format()}
        </Text>
      </Group>
      <Group gap={0} ml="md" wrap="nowrap">
        <SectionLabel component="span">Siirrot</SectionLabel>
        <Text component="span" c="primary.9" ml="xs">
          {totals.transfer.format()}
        </Text>
      </Group>
    </Group>
  );
}
