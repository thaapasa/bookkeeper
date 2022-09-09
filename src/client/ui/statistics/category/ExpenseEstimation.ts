import debug from 'debug';

import { sum } from 'shared/math/Numbers';
import { toPercentageDistribution } from 'shared/math/Percentages';
import {
  CategoryStatistics,
  CategoryStatisticsData,
} from 'shared/types/Statistics';
import { groupBy, numberRange } from 'shared/util/Arrays';
import Money from 'shared/util/Money';
import { MomentRange } from 'shared/util/TimeRange';
import { assertTrue } from 'shared/util/Util';
import { ChartColumn } from 'client/ui/chart/ChartTypes';
import { formatMoney } from 'client/ui/chart/Format';

const log = debug('bookkeeper:statistics:estimate');

/**
 * How large part of the year must be passed after we switch to use the
 * month distribution calculation
 */
const useMonthDistributionTolerance = 0.3;
const lastYearWeight = 0.3;

export function estimateMissingYearlyExpenses(
  categoryId: number,
  data: CategoryStatistics,
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
    // No data from last year
    return interpolateEstimate(estimateByThisYear, remainingPercentage);
  }

  if (yearPercentage < useMonthDistributionTolerance) {
    // Not enough data for this year to calculate by monthly distribution
    return weightedEstimateFromLastYear(
      estimateByThisYear,
      remainingPercentage,
      lastYearData[categoryId]
    );
  }

  // Calculate estimation based on last year's monthly distribution
  return estimateFromMontlyDistribution(
    currentSum,
    range,
    data.statistics[categoryId]
  );
}

function estimateFromMontlyDistribution(
  currentSum: number,
  range: MomentRange,
  categoryData: CategoryStatisticsData[]
) {
  const lastYear = range.endTime.year() - 1;
  // Calculate estimation based on last year's monthly distribution
  const months = groupBy(
    d => Number(d.month.substring(5, 7)),
    categoryData?.filter(e => Number(e.month.substring(0, 4)) === lastYear)
  );
  const sumDistribution = numberRange(1, 12).map(m =>
    Money.from(months[m]?.[0]?.sum ?? 0).valueOf()
  );
  const percentages = toPercentageDistribution(sumDistribution);
  log(
    `Estimating based on last year distribution ${sumDistribution}: ${percentages}`
  );

  // Zero based months here
  const ongoingMonth = range.endTime.month();
  const monthsLeft = numberRange(ongoingMonth + 1, 11);
  const percentagesFromMonthsLeft = monthsLeft
    .map(m => percentages[m])
    .reduce(sum, 0);

  const ongoingMonthPercentage = percentages[ongoingMonth];
  const positionInMonth =
    (range.endTime.date() - 1) / range.endTime.daysInMonth();

  const remainingPercentage =
    percentagesFromMonthsLeft + positionInMonth * ongoingMonthPercentage;
  assertTrue(remainingPercentage <= 1);

  // yearTotal = currentSum + remainingPercentage * yearTotal
  // 1 = currentSum / yearTotal + remainingPercentage
  // currentSum / yearTotal = 1 - remainingPercentage
  // (1 - remainingPercentage) * yearTotal = currentSum
  // yearTotal = currentSum / (1 - remainingPercentage)
  const yearTotal = currentSum / (1.0 - remainingPercentage);
  log(
    `Remaining percentage of sums is ${remainingPercentage.toFixed(
      2
    )} -> ${formatMoney(yearTotal)}`
  );

  return yearTotal - currentSum;
}

function weightedEstimateFromLastYear(
  estimateByThisYear: number,
  remainingPercentage: number,
  lastYearSum: number
) {
  // Use a weighted estimate of direct interpolation and last years expenses
  log(`Using year expenses: ${formatMoney(lastYearSum)}`);

  const fullEstimate =
    lastYearWeight * lastYearSum + (1 - lastYearWeight) * estimateByThisYear;
  const remaining = fullEstimate * remainingPercentage;
  log(
    `Weighted estimate ${formatMoney(fullEstimate)}, remaining: ${formatMoney(
      remaining
    )}`
  );
  return remaining;
}

function interpolateEstimate(
  estimateByThisYear: number,
  remainingPercentage: number
) {
  // Directly interpolate estimate
  const remaining = estimateByThisYear * remainingPercentage;
  log(`Estimated remaining by this year alone: ${formatMoney(remaining)}`);
  return remaining;
}