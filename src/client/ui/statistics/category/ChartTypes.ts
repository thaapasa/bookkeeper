import { TooltipProps, YAxisProps } from 'recharts';

import { Category, CategoryStatistics, ObjectId } from 'shared/types';
import { ChartData } from 'client/ui/chart/ChartTypes';

import { StatisticsChartType } from '../types';
import { CategoryGraphProps } from './CategoryStatisticsChart';
import { createMonthChartConfiguration } from './MonthsChartData';
import { createQuartersChartConfiguration } from './QuartersChartData';
import { createYearsChartConfiguration } from './YearsChartData';

export type ChartConfiguration<T extends string> = {
  convertData(
    data: CategoryStatistics,
    categoryMap: Record<ObjectId, Category>,
    estimated: boolean,
    separateEstimate: boolean
  ): ChartData<T, number>;
  dataKey: T;
  tickFormatter?: YAxisProps['tickFormatter'];
  labelFormatter?: TooltipProps<any, any>['labelFormatter'];
};

export function getChartConfiguration(
  type: Omit<StatisticsChartType, 'recurring'>,
  props: CategoryGraphProps
): ChartConfiguration<any> | null {
  switch (type) {
    case 'years':
      return createYearsChartConfiguration(props);
    case 'months':
      return createMonthChartConfiguration();
    case 'quarters':
      return createQuartersChartConfiguration();
    default:
      return null;
  }
}
