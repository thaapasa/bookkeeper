import { Center, Loader } from '@mantine/core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { ISOMonth, isSameMonth, monthRange, toDateTime } from 'shared/time';
import { apiConnect } from 'client/data/ApiConnect';
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

  const { data: expenseData, dataUpdatedAt } = useQuery({
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
  const navTargetId = useNavigationStore(s => s.expenseNavigationTargetId);
  const navSeq = useNavigationStore(s => s.expenseNavigationSeq);
  React.useEffect(() => {
    if (navTarget && !isSameMonth(navTarget, date)) {
      const path = expensesForMonthPath(navTarget);
      logger.info('Navigating to %s', path);
      navigate(path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navSeq]);

  // Scroll to the target row once the matching month's data is on screen.
  // Prefer the exact expense id when we have it; otherwise fall back to the
  // first row for that date.
  //
  // React Query keeps the previous data visible during a refetch, so we
  // record the moment each navigation request comes in and only scroll once
  // the query's dataUpdatedAt passes that point — otherwise we'd scroll to
  // the row's old position on edits that reorder the list.
  const scrollRequestedAt = React.useRef(0);
  const lastScrolledSeq = React.useRef(0);
  React.useEffect(() => {
    scrollRequestedAt.current = Date.now();
  }, [navSeq]);
  React.useEffect(() => {
    if (!navTarget || !expenseData) return;
    if (dataUpdatedAt < scrollRequestedAt.current) return;
    if (lastScrolledSeq.current === navSeq) return;
    if (!isSameMonth(navTarget, date)) return;
    const selector = navTargetId
      ? `[data-expense-id="${navTargetId}"]`
      : `[data-expense-date="${navTarget}"]`;
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      lastScrolledSeq.current = navSeq;
    }
  }, [dataUpdatedAt, expenseData, navSeq, navTarget, navTargetId, date]);

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
