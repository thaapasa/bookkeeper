import { Group, Stack, Table, Text } from '@mantine/core';
import * as React from 'react';

import { calculateTotals, UserExpense } from 'shared/expense';
import { toDateTime } from 'shared/time';
import { Category } from 'shared/types';
import { groupBy, noop, typedKeys } from 'shared/util';
import { UserDataProps } from 'client/data/Categories';
import { useUserData } from 'client/data/SessionStore';

import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { TotalSum } from './TotalSum';

interface ResultsViewOwnProps {
  results: UserExpense[];
  onUpdate: () => void;
  onSelectCategory: (cat: Category) => void;
}

export const ResultsView: React.FC<ResultsViewOwnProps> = ({ results, ...rest }) => {
  const userData = useUserData()!;
  return (
    <Stack gap={0}>
      <Text c="primary.7" mx="lg" my="xs">
        Hakutulokset
      </Text>
      <ResultsContents results={results} userData={userData} {...rest} />
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
      py="xs"
      w="100%"
      wrap="nowrap"
      style={{ boxSizing: 'border-box' }}
    >
      <Text c="primary.7" flex={1}>
        Vuosi {year}
      </Text>
      <TotalSum label="Yhteensä" sum={totals.total} ml="md" />
      <TotalSum label="Tulot" sum={totals.income} ml="md" visibleFrom="sm" />
      <TotalSum label="Menot" sum={totals.expense} ml="md" visibleFrom="xs" />
      <TotalSum label="Siirrot" sum={totals.transfer} ml="md" visibleFrom="sm" />
    </Group>
  );
}
