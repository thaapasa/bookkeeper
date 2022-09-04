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
> = ({ match, history }) => {
  const range = getDates(match.params);
  return <CategoryView range={range} history={history} />;
};

function getDates(params: CategoryRouteParams): TypedDateRange {
  if (params.year) {
    return yearRange(params.year);
  } else if (params.month) {
    return monthRange(params.month);
  } else {
    return yearRange(new Date());
  }
}
