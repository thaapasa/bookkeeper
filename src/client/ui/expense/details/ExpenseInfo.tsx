import { Box } from '@mantine/core';
import * as React from 'react';

import { ExpenseDivisionItem, UserExpense } from 'shared/expense';
import { Source, User } from 'shared/types';

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
      <AllColumns
        style={{
          backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-9))',
        }}
      >
        <Box pos="relative" ml={16}>
          <BasicData expense={expense} {...props} />
          <RecurrenceInfo expense={expense} />
          {expense.description ? (
            <Box bg="neutral.1" w="100%" p="12px 16px">
              {expense.description}
            </Box>
          ) : null}
          <DivisionInfo division={division} expenseType={expense.type} />
          <ExpenseInfoTools division={division} expense={expense} {...props} />
        </Box>
      </AllColumns>
    </Row>
  );
};
