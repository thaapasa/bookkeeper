import * as React from 'react';
import * as B from 'baconjs';
import styled from 'styled-components';
import { UserExpense } from 'shared/types/Expense';
import { secondaryColors, gray } from '../Colors';
import ExpenseRow from '../expense/row/ExpenseRow';
import { noop } from '../../../shared/util/Util';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { toMoment } from 'shared/util/Time';
import { Category } from 'shared/types/Session';
import { groupBy } from 'shared/util/Arrays';
import { typedKeys } from 'shared/util/Objects';
import { TotalsView } from './TotalsView';
import Money from 'shared/util/Money';

interface ResultsProps {
  results: UserExpense[];
  onUpdate: () => void;
  onSelectCategory: (cat: Category) => void;
  userData: UserDataProps;
}

class ResultsViewImpl extends React.Component<ResultsProps> {
  render() {
    return (
      <ResultsArea>
        <Header>Hakutulokset</Header>
        {this.renderResults()}
        {this.hasResults ? <TotalsView results={this.props.results} /> : null}
      </ResultsArea>
    );
  }

  get hasResults(): boolean {
    return this.props.results && this.props.results.length > 0;
  }

  get hasResultsFromPreviousYears(): boolean {
    const today = toMoment();
    return (
      this.props.results.find(r => !today.isSame(r.date, 'year')) !== undefined
    );
  }

  get resultsByYears(): Record<string, UserExpense[]> | undefined {
    return this.props.results && this.props.results.length > 0
      ? groupBy(e => String(toMoment(e.date).year()), this.props.results)
      : undefined;
  }

  private renderResults() {
    const results = this.resultsByYears;
    if (!results) {
      return <Info>Ei tuloksia, tarkista hakuehdot</Info>;
    }
    const years = typedKeys(results);
    const showYears = years.length > 1;
    return showYears
      ? years.map(y => this.renderYear(y, results[y]))
      : this.renderExpenses(results[years[0]]);
  }

  private renderYear(year: string, expenses: UserExpense[]) {
    return (
      <React.Fragment key={year}>
        <YearHeader year={year} expenses={expenses} />
        {this.renderExpenses(expenses)}
      </React.Fragment>
    );
  }

  private renderExpenses(expenses: UserExpense[]) {
    return (
      <ExpenseTableLayout className="padding">
        <tbody>
          {expenses.map(e => (
            <ExpenseRow
              key={e.id}
              expense={e}
              onUpdated={this.props.onUpdate}
              addFilter={noop}
              selectCategory={this.props.onSelectCategory}
              userData={this.props.userData}
            />
          ))}
        </tbody>
      </ExpenseTableLayout>
    );
  }
}

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
  padding-top: 16px;
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
