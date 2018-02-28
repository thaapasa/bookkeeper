import * as React from 'react';
import styled from 'styled-components';
import { ExpenseDivisionItem, UserExpense } from '../../../../shared/types/Expense';
import { User, Source } from '../../../../shared/types/Session';
import { LoadingIndicator, Row, AllColumns } from '../ExpenseTableLayout';
import BasicData from './BasicData';
import DivisionInfo from './DivisionInfo';
import RecurrenceInfo from './RecurrenceInfo';
import { colorScheme } from '../../Colors';

interface ExpenseInfoProps {
  division: ExpenseDivisionItem[];
  loading: boolean;
  expense: UserExpense;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
  user: User;
  source: Source;
  fullCategoryName: string;
}

export default class ExpenseInfo extends React.Component<ExpenseInfoProps, {}> {

  public render() {
    if (this.props.loading) {
      return <LoadingIndicator forRow={true} />;
    }
    return (
      <Row>
        <AllColumns className="gray">
          <ExpenseInfoContainer className="expense-info-container">
            <BasicData {...this.props} />
            <RecurrenceInfo expense={this.props.expense} />
            {this.props.expense.description ? <Description>{this.props.expense.description}</Description> : null}
            <DivisionInfo {...this.props}/>
          </ExpenseInfoContainer>
        </AllColumns>
      </Row>
    );
  }
}

const ExpenseInfoContainer = styled.div`
  position: relative;
  margin: 0 16px;
  background-color: ${colorScheme.primary.light};
  border-left: 1px solid ${colorScheme.primary.standard};
  border-right: 1px solid ${colorScheme.primary.standard};
`;

const Description = styled.div`
  background-color: ${colorScheme.gray.light};
  width: 100%;
  padding: 12px 16px;
`;
