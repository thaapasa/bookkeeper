import { Box, Table } from '@mantine/core';
import * as React from 'react';

import { ExpenseDivisionItem, UserExpense } from 'shared/expense';
import { StatementRow } from 'shared/statement';
import { Source } from 'shared/types';

import { AllColumns } from '../row/ExpenseTableColumns';
import { LoadingIndicator } from '../row/SpecialRows';
import { AuditInfo } from './AuditInfo';
import { BasicData } from './BasicData';
import { DivisionInfo } from './DivisionInfo';
import styles from './ExpenseInfo.module.css';
import { RecurrenceInfo } from './RecurrenceInfo';
import { StatementMatchInfo } from './StatementMatchInfo';

interface ExpenseInfoProps {
  division: ExpenseDivisionItem[];
  matchedStatementRows: StatementRow[];
  loading: boolean;
  expense: UserExpense;
  source: Source;
  fullCategoryName: string;
}

export const ExpenseInfo: React.FC<ExpenseInfoProps> = ({
  loading,
  expense,
  division,
  matchedStatementRows,
  source,
  fullCategoryName,
}) => {
  if (loading) {
    return <LoadingIndicator forRow={true} />;
  }

  return (
    <Table.Tr>
      <AllColumns className={styles.detailsBg} px={0} pt={0} pb={0}>
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
          <Box bg="surface.1" w="100%" px="md" py="sm">
            {expense.description}
          </Box>
        ) : null}
        <DivisionInfo
          division={division}
          expenseType={expense.type}
          ml={{ base: 1, xs: 56, sm: 92 }}
          mb="xs"
        />
        <StatementMatchInfo
          rows={matchedStatementRows}
          ml={{ base: 'md', xs: 56, sm: 92 }}
          mb="xs"
          maw={480}
        />
        <AuditInfo expense={expense} px="md" pb="xs" />
      </AllColumns>
    </Table.Tr>
  );
};
