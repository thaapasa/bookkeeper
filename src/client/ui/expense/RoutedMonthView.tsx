import * as React from 'react';
import { useParams } from 'react-router-dom';

import { toDayjs } from 'shared/time';

import { NewExpenseDialogRoutes } from './dialog/NewExpenseDialogPage';
import { MonthView } from './MonthView';

type MonthRouteParams = 'date';

export const RoutedMonthView: React.FC = () => {
  const { date } = useParams<MonthRouteParams>();
  const jsDate = date ? toDayjs(date + '-01').toDate() : new Date();
  return (
    <>
      <MonthView date={jsDate} />
      <NewExpenseDialogRoutes />
    </>
  );
};
