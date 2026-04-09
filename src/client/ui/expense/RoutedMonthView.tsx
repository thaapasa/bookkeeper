import { DateTime } from 'luxon';
import * as React from 'react';
import { useParams } from 'react-router-dom';

import { ISOMonth, ISOMonthRegExp } from 'shared/time';

import { NewExpenseDialogRoutes } from './dialog/NewExpenseDialogPage';
import { MonthView } from './MonthView';

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

export const RoutedMonthView: React.FC = () => {
  const { date } = useParams<MonthRouteParams>();
  const month = parseMonth(date);
  return (
    <>
      <MonthView date={month} />
      <NewExpenseDialogRoutes />
    </>
  );
};
