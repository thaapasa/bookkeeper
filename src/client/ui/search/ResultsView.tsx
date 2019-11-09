import * as React from 'react';
import * as B from 'baconjs';
import styled from 'styled-components';
import { UserExpense } from 'shared/types/Expense';
import { secondaryColors, gray } from '../Colors';
import ExpenseRow from '../expense/row/ExpenseRow';
import { noop } from '../../../shared/util/Util';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import {
  ExpenseTableLayout,
  AllColumns,
  Row,
} from '../expense/row/ExpenseTableLayout';
import { toMoment } from 'shared/util/Time';
import { Moment } from 'moment';
import { Category } from 'shared/types/Session';

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

  private renderResults() {
    if (!this.props.results || this.props.results.length < 1) {
      return <Info>Ei tuloksia, tarkista hakuehdot</Info>;
    }
    const showYears = this.hasResultsFromPreviousYears;
    let lastResDate: Moment | undefined;
    return (
      <ExpenseTableLayout className="padding">
        <tbody>
          {this.props.results.map(e => {
            const mom = toMoment(e.date);
            const header =
              showYears &&
              (!lastResDate || !lastResDate.isSame(mom, 'year')) ? (
                <Row>
                  <YearHeader>Vuosi {mom.year()}</YearHeader>
                </Row>
              ) : null;
            lastResDate = mom;
            return (
              <React.Fragment key={e.id}>
                {header}
                <ExpenseRow
                  expense={e}
                  onUpdated={this.props.onUpdate}
                  addFilter={noop}
                  selectCategory={this.props.onSelectCategory}
                  userData={this.props.userData}
                />
              </React.Fragment>
            );
          })}
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

const YearHeader = styled(AllColumns)`
  color: ${secondaryColors.dark};
  padding: 0px 8px;
  background-color: ${gray.light};
  width: 100%;
  font-size: 16px;
`;

const Info = styled.div`
  margin: 8px 24px;
`;
