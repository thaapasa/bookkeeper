import React from 'react';
import { RouteComponentProps } from 'react-router';

import { monthRange, TypedDateRange, yearRange } from 'shared/util/TimeRange';

import CategoryView from './CategoryView';

interface CategoryRouteParams {
  year?: string;
  month?: string;
}

export const RoutedCategoryView: React.FC<
  RouteComponentProps<CategoryRouteParams>
> = ({
  match: {
    params: { year, month },
  },
  history,
}) => {
  const range = React.useMemo(() => getDates(year, month), [year, month]);
  return <CategoryView range={range} history={history} />;
};

function getDates(year?: string, month?: string): TypedDateRange {
  if (year) {
    return yearRange(year);
  } else if (month) {
    return monthRange(month);
  } else {
    return yearRange(new Date());
  }
}
