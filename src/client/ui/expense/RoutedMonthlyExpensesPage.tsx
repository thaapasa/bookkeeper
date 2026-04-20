import { DateTime } from 'luxon';
import * as React from 'react';
import { useParams } from 'react-router-dom';

import { ISOMonth, ISOMonthRegExp } from 'shared/time';

import { NewExpenseDialogRoutes } from './dialog/NewExpenseDialogPage';
import { MonthlyExpensesPage } from './MonthlyExpensesPage';

type MonthRouteParams = 'date';

function currentMonth(): ISOMonth {
  return DateTime.now().toFormat('yyyy-MM') as ISOMonth;
}

// Validate URL param as ISOMonth; fall back to current month on invalid input
// (e.g. user typos `/m/garbage` in the URL bar)
function parseMonth(date?: string): ISOMonth {
  if (date && ISOMonthRegExp.test(date)) {
    return date as ISOMonth;
  }
  return currentMonth();
}

export const RoutedMonthlyExpensesPage: React.FC = () => {
  const { date } = useParams<MonthRouteParams>();
  const month = parseMonth(date);
  return (
    <>
      <MonthlyExpensesPage date={month} />
      <NewExpenseDialogRoutes />
    </>
  );
};
