import { styled } from '@mui/material';
import * as React from 'react';

import { ExpenseDivisionItem, UserExpense } from 'shared/expense';
import { Source, User } from 'shared/types';
import { colorScheme } from 'client/ui/Colors';

import { AllColumns, LoadingIndicator, Row } from '../row/ExpenseTableLayout';
import { BasicData } from './BasicData';
import { DivisionInfo } from './DivisionInfo';
import { ExpenseInfoTools } from './ExpenseInfoTools';
import { RecurrenceInfo } from './RecurrenceInfo';

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

export const ExpenseInfo: React.FC<ExpenseInfoProps> = ({
  loading,
  expense,
  division,
  ...props
}) => {
  if (loading) {
    return <LoadingIndicator forRow={true} />;
  }
  return (
    <Row>
      <AllColumns className="dark">
        <ExpenseInfoContainer className="expense-info-container">
          <BasicData expense={expense} {...props} />
          <RecurrenceInfo expense={expense} />
          {expense.description ? <Description>{expense.description}</Description> : null}
          <DivisionInfo division={division} expenseType={expense.type} />
          <ExpenseInfoTools division={division} expense={expense} {...props} />
        </ExpenseInfoContainer>
      </AllColumns>
    </Row>
  );
};

const ExpenseInfoContainer = styled('div')`
  position: relative;
  margin-left: 16px;
  background-color: ${colorScheme.primary.light};
`;

const Description = styled('div')`
  background-color: ${colorScheme.gray.light};
  width: 100%;
  padding: 12px 16px;
`;
