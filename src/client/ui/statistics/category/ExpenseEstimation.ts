import debug from 'debug';

import { CategoryStatistics } from 'shared/types/Statistics';
import { MomentRange } from 'shared/util/TimeRange';
import { ChartColumn } from 'client/ui/chart/ChartTypes';
import { formatMoney } from 'client/ui/chart/Format';

const log = debug('bookkeeper:statistics:estimate');

const lastYearWeight = 0.3;

export function estimateMissingYearlyExpenses(
  categoryId: number,
  _data: CategoryStatistics,
  chartData: ChartColumn<'year', number>[],
  range: MomentRange
) {
  const lastData = chartData[chartData.length - 1];
  const currentSum = lastData[categoryId];

  const yearEnd = range.endTime.clone().endOf('year');
  const daysInYear = yearEnd.dayOfYear();
  const dayAtEnd = range.endTime.dayOfYear();
  const yearPercentage = dayAtEnd / daysInYear;
  const remainingPercentage = 1 - yearPercentage;

  const estimateByThisYear = currentSum / yearPercentage;

  log(
    `Estimating ${yearEnd.year()} for ${categoryId}, at ${(
      yearPercentage * 100
    ).toFixed(2)} % (${dayAtEnd}/${daysInYear}) with ${formatMoney(
      currentSum
    )} -> ${formatMoney(estimateByThisYear)}`
  );

  const lastYearData = chartData[chartData.length - 2];
  if (!lastYearData) {
    const remaining = estimateByThisYear * remainingPercentage;
    log(`Estimated remaining by this year alone: ${formatMoney(remaining)}`);
    return remaining;
  }

  log(`Last year expenses: ${formatMoney(lastYearData[categoryId])}`);

  const fullEstimate =
    lastYearWeight * lastYearData[categoryId] +
    (1 - lastYearWeight) * estimateByThisYear;
  const remaining = fullEstimate * remainingPercentage;
  log(
    `Weighted estimate ${formatMoney(fullEstimate)}, remaining: ${formatMoney(
      remaining
    )}`
  );
  return remaining;
}
