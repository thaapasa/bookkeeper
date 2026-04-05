import { Box, Table } from '@mantine/core';
import * as React from 'react';

import { ExpenseDivisionItem, UserExpense } from 'shared/expense';
import { Source } from 'shared/types';

import { AllColumns } from '../row/ExpenseTableColumns';
import { LoadingIndicator } from '../row/SpecialRows';
import { BasicData } from './BasicData';
import { DivisionInfo } from './DivisionInfo';
import styles from './ExpenseInfo.module.css';
import { ExpenseInfoTools } from './ExpenseInfoTools';
import { RecurrenceInfo } from './RecurrenceInfo';

interface ExpenseInfoProps {
  division: ExpenseDivisionItem[];
  loading: boolean;
  expense: UserExpense;
  onModify: (e: UserExpense) => void;
  onDelete: (e: UserExpense) => void;
  source: Source;
  fullCategoryName: string;
}

export const ExpenseInfo: React.FC<ExpenseInfoProps> = ({
  loading,
  expense,
  division,
  onModify,
  onDelete,
  source,
  fullCategoryName,
}) => {
  if (loading) {
    return <LoadingIndicator forRow={true} />;
  }
  return (
    <Table.Tr>
      <AllColumns className={styles.detailsBg} pos="relative" p={0}>
        <RecurrenceInfo expense={expense} m={0} h={50} />
        <BasicData
          hiddenFrom="md"
          px="md"
          pt="xs"
          mb="sm"
          expense={expense}
          source={source}
          fullCategoryName={fullCategoryName}
        />
        {expense.description ? (
          <Box bg="neutral.1" w="100%" px="md" py="sm">
            {expense.description}
          </Box>
        ) : null}
        <DivisionInfo
          division={division}
          expenseType={expense.type}
          ml={{ base: 56, sm: 92 }}
          mb="xs"
        />
        <ExpenseInfoTools
          division={division}
          expense={expense}
          onModify={onModify}
          onDelete={onDelete}
          pos="absolute"
          right={0}
          top={0}
          p="sm"
        />
      </AllColumns>
    </Table.Tr>
  );
};
