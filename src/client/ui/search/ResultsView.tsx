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
      </ResultsArea>
    );
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
        <YearHeader>Vuosi {year}</YearHeader>
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

const ResultsArea = styled.div`
  padding-top: 16px;
`;

const Header = styled.div`
  color: ${secondaryColors.dark};
  margin: 8px 24px;
`;

const YearHeader = styled.div`
  color: ${secondaryColors.dark};
  padding: 16px 24px;
  background-color: ${gray.light};
  width: 100%;
  font-size: 16px;
`;

const Info = styled.div`
  margin: 8px 24px;
`;
