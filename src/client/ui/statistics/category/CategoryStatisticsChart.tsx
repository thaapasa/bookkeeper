import * as React from 'react';

import { Category } from 'shared/types/Session';
import { CategoryStatistics } from 'shared/types/Statistics';
import { Size } from 'client/ui/Types';
import { MeasureSize } from 'client/ui/utils/MeasureSize';

import { StatisticsChartType } from '../types';
import { MonthsCategoryChart } from './MonthsChart';
import { YearlyRecurringCategoryChart } from './YearlyRecurringChart';
import { YearsCategoryChart } from './YearsChart';

const StatisticsGraphImpl: React.FC<{
  type: StatisticsChartType;
  data: CategoryStatistics;
  categoryMap: Record<string, Category>;
  size: Size;
}> = ({ type, ...props }) => {
  switch (type) {
    case 'recurring':
      return <YearlyRecurringCategoryChart {...props} />;
    case 'years':
      return <YearsCategoryChart {...props} />;
    case 'months':
      return <MonthsCategoryChart {...props} />;
    default:
      return null;
  }
};

export const CategoryStatisticsChart = MeasureSize(StatisticsGraphImpl);
