import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { UserExpense } from 'shared/expense';
import { ISOMonth, isSameMonth, monthRange, toDateTime } from 'shared/time';
import apiConnect from 'client/data/ApiConnect';
import { QueryKeys } from 'client/data/queryKeys';
import { navigationBus, needUpdateE } from 'client/data/State';
import { logger } from 'client/Logger';
import { expensePagePath, expensesForMonthPath } from 'client/util/Links';

import { zeroStatus } from './ExpenseHelper';
import { ExpenseTable } from './ExpenseTable';

interface MonthViewProps {
  date: ISOMonth;
}

const zeroStatuses = {
  startStatus: zeroStatus,
  endStatus: zeroStatus,
  monthStatus: zeroStatus,
};

const noExpenses: UserExpense[] = [];

export const MonthView: React.FC<MonthViewProps> = ({ date }) => {
  // Side effect: update navigation state
  React.useEffect(() => {
    const m = toDateTime(date);
    navigationBus.push({ dateRange: monthRange(m), pathPrefix: expensePagePath });
  }, [date]);

  const { data: expenseData, isLoading } = useQuery({
    queryKey: QueryKeys.expenses.month(date),
    queryFn: () => {
      const m = toDateTime(date);
      return apiConnect.getExpensesForMonth(m.year, m.month);
    },
  });

  const statuses = React.useMemo(
    () =>
      expenseData
        ? {
            startStatus: expenseData.startStatus,
            endStatus: expenseData.endStatus,
            monthStatus: expenseData.monthStatus,
          }
        : zeroStatuses,
    [expenseData],
  );

  const loadedExpenseArray = expenseData?.expenses;
  const [expenses, setExpenses] = React.useState<UserExpense[] | undefined>(undefined);
  React.useEffect(() => setExpenses(loadedExpenseArray), [loadedExpenseArray]);

  // Retain needUpdateE subscription only for cross-month navigation.
  // Same-month reload is handled by the needUpdateE → query invalidation bridge.
  const navigate = useNavigate();
  React.useEffect(
    () =>
      needUpdateE.onValue(newDate => {
        if (!isSameMonth(newDate, date)) {
          const path = expensesForMonthPath(newDate);
          logger.info('Navigating to %s', path);
          navigate(path);
        }
      }),
    [navigate, date],
  );

  return (
    <ExpenseTable
      expenses={expenses ?? noExpenses}
      loading={isLoading}
      startStatus={statuses.startStatus}
      endStatus={statuses.endStatus}
      monthStatus={statuses.monthStatus}
      unconfirmedBefore={expenseData?.unconfirmedBefore ?? false}
      onUpdateExpense={(id, data) =>
        expenses ? setExpenses(expenses.map(e => (e.id === id ? data : e))) : undefined
      }
    />
  );
};
