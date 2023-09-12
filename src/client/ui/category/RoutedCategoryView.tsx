import React from 'react';
import { useParams } from 'react-router';

import { monthRange, TypedDateRange, yearRange } from 'shared/time';

import CategoryView from './CategoryView';

type CategoryRouteParams = 'year' | 'month';

export const RoutedCategoryView: React.FC = () => {
  const { year, month } = useParams<CategoryRouteParams>();
  const range = React.useMemo(() => getDates(year, month), [year, month]);
  return <CategoryView range={range} />;
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
