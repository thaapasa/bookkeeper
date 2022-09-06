import * as React from 'react';

import { Category } from 'shared/types/Session';
import { CategoryStatistics } from 'shared/types/Statistics';

import { Size } from '../Types';
import { MeasureSize } from '../utils/MeasureSize';
import { MonthsCategoryChart } from './MonthsChart';
import { StatisticsChartType } from './types';
import { YearlyCategoryChart } from './YearlyChart';
import { YearsCategoryChart } from './YearsChart';

const StatisticsGraphImpl: React.FC<{
  type: StatisticsChartType;
  statistics: CategoryStatistics;
  categoryMap: Record<string, Category>;
  size: Size;
}> = ({ type, ...props }) => {
  switch (type) {
    case 'yearly':
      return <YearlyCategoryChart {...props} />;
    case 'years':
      return <YearsCategoryChart {...props} />;
    case 'months':
      return <MonthsCategoryChart {...props} />;
    default:
      return null;
  }
};

export const StatisticsChart = MeasureSize(StatisticsGraphImpl);
