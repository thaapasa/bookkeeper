import { useSuspenseQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { UserExpense } from 'shared/expense';
import { ISOMonth, isSameMonth, monthRange, toDateTime } from 'shared/time';
import apiConnect from 'client/data/ApiConnect';
import { useNavigationStore } from 'client/data/NavigationStore';
import { QueryKeys } from 'client/data/queryKeys';
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
    useNavigationStore
      .getState()
      .setNavigation({ dateRange: monthRange(m), pathPrefix: expensePagePath });
  }, [date]);

  const { data: expenseData } = useSuspenseQuery({
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

  // Navigate to another month when an expense is saved with a different month's date.
  const navigate = useNavigate();
  const navTarget = useNavigationStore(s => s.expenseNavigationTarget);
  const navSeq = useNavigationStore(s => s.expenseNavigationSeq);
  React.useEffect(() => {
    if (navTarget && !isSameMonth(navTarget, date)) {
      const path = expensesForMonthPath(navTarget);
      logger.info('Navigating to %s', path);
      navigate(path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navSeq]);

  return (
    <ExpenseTable
      expenses={expenses ?? noExpenses}
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
