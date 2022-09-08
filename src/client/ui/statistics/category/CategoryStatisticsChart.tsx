import * as React from 'react';

import { Category } from 'shared/types/Session';
import { CategoryStatistics } from 'shared/types/Statistics';
import { Size } from 'client/ui/Types';
import { MeasureSize } from 'client/ui/utils/MeasureSize';

import { StatisticsChartType } from '../types';
import { MonthsCategoryChart } from './MonthsChart';
import { YearlyRecurringCategoryChart } from './YearlyRecurringChart';
import { YearsCategoryChart } from './YearsChart';

export interface CategoryGraphProps {
  data: CategoryStatistics;
  stacked: boolean;
  estimated: boolean;
  categoryMap: Record<string, Category>;
  size: Size;
}

const StatisticsGraphImpl: React.FC<
  CategoryGraphProps & { type: StatisticsChartType }
> = ({ type, ...props }) => {
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
