import { Center, Loader } from '@mantine/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { ISOMonth, isSameMonth, monthRange, toDateTime } from 'shared/time';
import apiConnect from 'client/data/ApiConnect';
import { useNavigationStore } from 'client/data/NavigationStore';
import { updateExpenseInMonthCache } from 'client/data/query';
import { QueryKeys } from 'client/data/queryKeys';
import { logger } from 'client/Logger';
import { expensePagePath, expensesForMonthPath } from 'client/util/Links';

import { ExpenseTable } from './ExpenseTable';

interface MonthlyExpensesPageProps {
  date: ISOMonth;
}

export const MonthlyExpensesPage: React.FC<MonthlyExpensesPageProps> = ({ date }) => {
  // Side effect: update navigation state
  React.useEffect(() => {
    const m = toDateTime(date);
    useNavigationStore
      .getState()
      .setNavigation({ dateRange: monthRange(m), pathPrefix: expensePagePath });
  }, [date]);

  const { data: expenseData } = useQuery({
    queryKey: QueryKeys.expenses.month(date),
    queryFn: () => {
      const m = toDateTime(date);
      return apiConnect.getExpensesForMonth(m.year, m.month);
    },
    placeholderData: keepPreviousData,
  });

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

  if (!expenseData) {
    return (
      <Center pt="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <ExpenseTable
      expenses={expenseData.expenses}
      startStatus={expenseData.startStatus}
      endStatus={expenseData.endStatus}
      monthStatus={expenseData.monthStatus}
      unconfirmedBefore={expenseData.unconfirmedBefore}
      onUpdateExpense={(id, updated) => updateExpenseInMonthCache(date, id, updated)}
    />
  );
};
