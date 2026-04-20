import React from 'react';
import { useParams } from 'react-router';

import {
  ISOMonthRegExp,
  ISOYearRegExp,
  monthRange,
  toISODate,
  TypedDateRange,
  yearRange,
} from 'shared/time';

import { CategoryPage } from './CategoryPage';

type CategoryRouteParams = 'year' | 'month';

export const RoutedCategoryPage: React.FC = () => {
  const { year, month } = useParams<CategoryRouteParams>();
  const range = React.useMemo(() => getDates(year, month), [year, month]);
  return <CategoryPage range={range} />;
};

// Validate URL params; fall back to current year on invalid input
function getDates(year?: string, month?: string): TypedDateRange {
  if (year && ISOYearRegExp.test(year)) {
    return yearRange(year);
  } else if (month && ISOMonthRegExp.test(month)) {
    return monthRange(month);
  } else {
    return yearRange(toISODate());
  }
}
