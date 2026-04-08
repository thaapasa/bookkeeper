import { DateTime } from 'luxon';
import * as React from 'react';
import { useParams } from 'react-router-dom';

import { ISOMonth } from 'shared/time';

import { NewExpenseDialogRoutes } from './dialog/NewExpenseDialogPage';
import { MonthView } from './MonthView';

type MonthRouteParams = 'date';

export const RoutedMonthView: React.FC = () => {
  const { date } = useParams<MonthRouteParams>();
  const month = (date ?? DateTime.now().toFormat('yyyy-MM')) as ISOMonth;
  return (
    <>
      <MonthView date={month} />
      <NewExpenseDialogRoutes />
    </>
  );
};
