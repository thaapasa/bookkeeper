import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { toMoment } from 'shared/time';

import MonthView from './MonthView';

interface MonthRouteParams {
  date?: string;
}

export const RoutedMonthView: React.FC<
  RouteComponentProps<MonthRouteParams>
> = ({
  history,
  match: {
    params: { date },
  },
}) => {
  const jsDate = date ? toMoment(date + '-01').toDate() : new Date();
  return <MonthView date={jsDate} history={history} />;
};
