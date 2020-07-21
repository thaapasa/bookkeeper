import * as React from 'react';
import styled from 'styled-components';
import { ExpenseDivisionItem, UserExpense } from 'shared/types/Expense';
import { User, Source } from 'shared/types/Session';
import { LoadingIndicator, Row, AllColumns } from '../row/ExpenseTableLayout';
import BasicData from './BasicData';
import { DivisionInfo } from './DivisionInfo';
import RecurrenceInfo from './RecurrenceInfo';
import { colorScheme } from 'client/ui/Colors';
import ExpenseInfoTools from './ExpenseInfoTools';

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

export const ExpenseInfo = (props: ExpenseInfoProps) => {
  if (props.loading) {
    return <LoadingIndicator forRow={true} />;
  }
  return (
    <Row>
      <AllColumns className="dark">
        <ExpenseInfoContainer className="expense-info-container">
          <BasicData {...props} />
          <RecurrenceInfo expense={props.expense} />
          {props.expense.description ? (
            <Description>{props.expense.description}</Description>
          ) : null}
          <DivisionInfo
            division={props.division}
            expenseType={props.expense.type}
          />
          <ExpenseInfoTools {...props} />
        </ExpenseInfoContainer>
      </AllColumns>
    </Row>
  );
};

const ExpenseInfoContainer = styled.div`
  position: relative;
  margin-left: 16px;
  background-color: ${colorScheme.primary.light};
`;

const Description = styled.div`
  background-color: ${colorScheme.gray.light};
  width: 100%;
  padding: 12px 16px;
`;
