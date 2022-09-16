import * as B from 'baconjs';
import * as React from 'react';
import styled from 'styled-components';

import { UserExpense } from 'shared/expense';
import { toMoment } from 'shared/time';
import { Category } from 'shared/types';
import { groupBy, Money, noop, typedKeys } from 'shared/util';
import { userDataE, UserDataProps } from 'client/data/Categories';

import { gray, secondaryColors } from '../Colors';
import { connect } from '../component/BaconConnect';
import ExpenseRow from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { media } from '../Styles';
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
      <Header>Hakutulokset</Header>
      <ResultsContents results={results} {...rest} />
      {hasResults ? <TotalsView results={results} /> : null}
    </ResultsArea>
  );
};

const ResultsContents: React.FC<ResultsProps> = ({ results, ...rest }) => {
  const resultsByYears: Record<string, UserExpense[]> | undefined =
    results && results.length > 0
      ? groupBy(e => String(toMoment(e.date).year()), results)
      : undefined;

  if (!resultsByYears) {
    return <Info>Ei tuloksia, tarkista hakuehdot</Info>;
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

const ExpenseYear: React.FC<ResultsProps & { year: string }> = ({
  results,
  year,
  ...rest
}) => (
  <>
    <YearHeader year={year} expenses={results} />
    <ExpenseList results={results} {...rest} />
  </>
);

const ExpenseList: React.FC<ResultsProps> = ({
  results,
  onUpdate,
  onSelectCategory,
  userData,
}) => (
  <ExpenseTableLayout className="padding">
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

export const ResultsView = connect(B.combineTemplate({ userData: userDataE }))(
  ResultsViewImpl
);

function YearHeader({
  year,
  expenses,
}: {
  year: string;
  expenses: UserExpense[];
}) {
  const sum = expenses.reduce((p, c) => p.plus(c.sum), Money.from(0));
  const income = expenses
    .filter(r => r.type === 'income')
    .reduce((p, c) => p.plus(c.sum), Money.from(0));
  const cost = expenses
    .filter(r => r.type === 'expense')
    .reduce((p, c) => p.plus(c.sum), Money.from(0));
  return (
    <YearHeaderRow>
      <HeaderText>Vuosi {year}</HeaderText>
      <SumColumn>
        <SumLabel>Yhteensä</SumLabel>
        <SumValue>{sum.format()}</SumValue>
      </SumColumn>
      <SumColumn>
        <SumLabel>Tulot</SumLabel>
        <SumValue>{income.format()}</SumValue>
      </SumColumn>
      <SumColumn>
        <SumLabel>Menot</SumLabel>
        <SumValue>{cost.format()}</SumValue>
      </SumColumn>
    </YearHeaderRow>
  );
}

const ResultsArea = styled.div`
  ${media.web`
    overflow-y: scroll;
  `}
`;

const Header = styled.div`
  color: ${secondaryColors.dark};
  margin: 8px 24px;
`;

const YearHeaderRow = styled.div`
  padding: 16px 24px;
  background-color: ${gray.light};
  width: 100%;
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
`;

const HeaderText = styled.div`
  color: ${secondaryColors.dark};
  font-size: 16px;
  flex: 1;
`;

const SumColumn = styled.div`
  display: flex;
  flex-direction: row;
  margin-left: 16px;
`;

const SumLabel = styled.span`
  font-weight: bold;
  color: ${secondaryColors.dark};
`;

const SumValue = styled.div`
  margin-left: 8px;
  color: ${secondaryColors.text};
`;

const Info = styled.div`
  margin: 8px 24px;
`;
