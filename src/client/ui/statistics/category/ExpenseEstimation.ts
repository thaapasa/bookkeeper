import debug from 'debug';

import { CategoryStatistics } from 'shared/types/Statistics';
import { MomentRange } from 'shared/util/TimeRange';
import { ChartColumn } from 'client/ui/chart/ChartTypes';

const log = debug('bookkeeper:statistics:estimate');

export function estimateMissingYearlyExpenses(
  categoryId: number,
  _data: CategoryStatistics,
  chartData: ChartColumn<'year', number>[],
  _range: MomentRange
) {
  const lastData = chartData[chartData.length - 1];
  const currentSum = lastData[categoryId];
  log(`Estimating expenses for ${categoryId}, starting from ${currentSum}`);
  return 350;
}
