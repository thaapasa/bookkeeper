import { Box, Table } from '@mantine/core';
import * as React from 'react';

import { ExpenseDivisionItem, UserExpense } from 'shared/expense';
import { Source, User } from 'shared/types';

import { useIsMobile, useIsMobilePortrait } from '../../hooks/useBreakpoints.ts';
import { AllColumns } from '../row/Breakpoints.tsx';
import { LoadingIndicator } from '../row/SpecialRows.tsx';
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
  const isSm = useIsMobilePortrait();
  const isXs = useIsMobile();
  const divisionMl = isXs ? 46 : isSm ? 80 : 82;
  if (loading) {
    return <LoadingIndicator forRow={true} />;
  }
  return (
    <Table.Tr>
      <AllColumns
        bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-9))"
        pos="relative"
      >
        <BasicData expense={expense} {...props} />
        <RecurrenceInfo expense={expense} />
        {expense.description ? (
          <Box bg="neutral.1" w="100%" p="12px 16px">
            {expense.description}
          </Box>
        ) : null}
        <DivisionInfo division={division} expenseType={expense.type} ml={divisionMl} />
        <ExpenseInfoTools division={division} expense={expense} {...props} />
      </AllColumns>
    </Table.Tr>
  );
};
