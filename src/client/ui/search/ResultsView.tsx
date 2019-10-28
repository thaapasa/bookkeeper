import * as React from 'react';
import * as B from 'baconjs';
import styled from 'styled-components';
import { UserExpense } from 'shared/types/Expense';
import { secondaryColors } from '../Colors';
import ExpenseRow from '../expense/row/ExpenseRow';
import { noop } from '../../../shared/util/Util';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';

interface ResultsProps {
  results: UserExpense[];
  onUpdate: () => void;
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

  private renderResults() {
    if (!this.props.results || this.props.results.length < 1) {
      return <Info>Ei tuloksia, tarkista hakuehdot</Info>;
    }
    return (
      <ExpenseTableLayout className="padding">
        <tbody>
          {this.props.results.map(e => (
            <ExpenseRow
              key={e.id}
              expense={e}
              onUpdated={this.props.onUpdate}
              addFilter={noop}
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

const Info = styled.div`
  margin: 8px 24px;
`;
