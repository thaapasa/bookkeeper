import styled from '@emotion/styled';
import { Group, Text } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';

import { calculateTotals, UserExpense } from 'shared/expense';
import { toDateTime } from 'shared/time';
import { Category } from 'shared/types';
import { groupBy, noop, typedKeys } from 'shared/util';
import { userDataP, UserDataProps } from 'client/data/Categories';

import { connect } from '../component/BaconConnect';
import { SectionLabel } from '../design/Text';
import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { media } from '../layout/Styles.ts';
import { TotalsView } from './TotalsView';

interface ResultsProps {
  results: UserExpense[];
  onUpdate: () => void;
  onSelectCategory: (cat: Category) => void;
  userData: UserDataProps;
}

const ResultsViewImpl: React.FC<ResultsProps> = ({ results, ...rest }) => {
  const hasResults = results && results.length > 0;
  return (
    <ResultsArea>
      <Text c="primary.7" m="8px 24px">
        Hakutulokset
      </Text>
      <ResultsContents results={results} {...rest} />
      {hasResults ? <TotalsView results={results} /> : null}
    </ResultsArea>
  );
};

const ResultsContents: React.FC<ResultsProps> = ({ results, ...rest }) => {
  const resultsByYears: Record<string, UserExpense[]> | undefined =
    results && results.length > 0
      ? groupBy(e => String(toDateTime(e.date).year), results)
      : undefined;

  if (!resultsByYears) {
    return <Text m="8px 24px">Ei tuloksia, tarkista hakuehdot</Text>;
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
    <tbody>
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
    </tbody>
  </ExpenseTableLayout>
);

export const ResultsView = connect(B.combineTemplate({ userData: userDataP }))(ResultsViewImpl);

function YearHeader({ year, expenses }: { year: string; expenses: UserExpense[] }) {
  const totals = calculateTotals(expenses);
  return (
    <Group bg="neutral.1" p="16px 24px" w="100%" wrap="nowrap" style={{ boxSizing: 'border-box' }}>
      <Text c="primary.7" flex={1}>
        Vuosi {year}
      </Text>
      <Group gap={0} ml={16} wrap="nowrap">
        <SectionLabel component="span">Yhteensä</SectionLabel>
        <Text component="span" c="primary.9" ml={8}>
          {totals.total.format()}
        </Text>
      </Group>
      <Group gap={0} ml={16} wrap="nowrap">
        <SectionLabel component="span">Tulot</SectionLabel>
        <Text component="span" c="primary.9" ml={8}>
          {totals.income.format()}
        </Text>
      </Group>
      <Group gap={0} ml={16} wrap="nowrap">
        <SectionLabel component="span">Menot</SectionLabel>
        <Text component="span" c="primary.9" ml={8}>
          {totals.expense.format()}
        </Text>
      </Group>
      <Group gap={0} ml={16} wrap="nowrap">
        <SectionLabel component="span">Siirrot</SectionLabel>
        <Text component="span" c="primary.9" ml={8}>
          {totals.transfer.format()}
        </Text>
      </Group>
    </Group>
  );
}

const ResultsArea = styled.div`
  ${media.web`
    overflow-y: scroll;
  `}
`;
