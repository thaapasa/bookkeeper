import { getMonthsInRange, ISOMonth } from 'shared/time';
import { Category, CategoryStatistics, ObjectId } from 'shared/types';
import { Money, typedKeys } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import { getChartColor } from 'client/ui/chart/ChartColors';
import { ChartColumn, ChartData } from 'client/ui/chart/ChartTypes';
import { fillMissingForNumericKeys } from 'client/ui/chart/ChartUtils';

import { ChartConfiguration } from './ChartTypes';

function categoryStatisticsToMonthlyData(
  data: CategoryStatistics,
  categoryMap: Record<ObjectId, Category>,
): ChartData<'month', number> {
  const keys = typedKeys(data.statistics);
  const allMonths = getMonthsInRange(data.range);
  const allData = Object.values(data.statistics).flat(1);

  const byMonths: Record<ISOMonth, ChartColumn<'month', number>> = {};
  for (const stat of allData) {
    const month = stat.month;
    byMonths[month] ??= { month };
    byMonths[month][stat.categoryId] = Money.from(stat.sum).valueOf();
  }

  return {
    chartData: allMonths.map(month => byMonths[month] ?? { month }).map(d => fillMissingForNumericKeys(d, keys)),
    keys: keys.map((key, i) => ({
      key,
      color: getChartColor(i, 0),
      name: getFullCategoryName(Number(key), categoryMap),
      dataId: Number(key),
    })),
  };
}

function formatMonth(m: ISOMonth) {
  return m.replace('-', '/');
}

const MonthConfig: ChartConfiguration<'month'> = {
  convertData: categoryStatisticsToMonthlyData,
  dataKey: 'month',
  tickFormatter: formatMonth,
  labelFormatter: formatMonth,
};

export function createMonthChartConfiguration(): ChartConfiguration<'month'> {
  return MonthConfig;
}
