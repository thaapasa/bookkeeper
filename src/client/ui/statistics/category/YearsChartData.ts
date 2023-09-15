import { dateRangeToMomentRange, getYearsInRange, MomentRange, toDayjs } from 'shared/time';
import { Category, CategoryStatistics, CategoryStatisticsData, ObjectId } from 'shared/types';
import { Money, recordFromPairs, typedKeys } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import { getChartColor } from 'client/ui/chart/ChartColors';
import { ChartColumn, ChartData, ChartKeyInfo } from 'client/ui/chart/ChartTypes';
import { fillMissingForNumericKeys, mapChartData } from 'client/ui/chart/ChartUtils';

import { CategoryGraphProps } from './CategoryStatisticsChart';
import { ChartConfiguration } from './ChartTypes';
import { estimateMissingYearlyExpenses } from './ExpenseEstimation';

interface YearlyDataItem {
  year: number;
  sum: number;
  categoryId: number;
}

function categoryStatisticsToYearlyData(
  data: CategoryStatistics,
  categoryMap: Record<ObjectId, Category>,
  estimated: boolean,
  separateEstimate: boolean,
): ChartData<'year', number> {
  const cats = typedKeys(data.statistics);
  const years = getYearsInRange(data.range);
  const summedYears = cats.map(catId => sumYears(data.statistics[catId]));
  const allData = summedYears.flat(1);

  const byYears: Record<number, ChartColumn<'year', number>> = {};

  for (const stat of allData) {
    const year = stat.year;
    byYears[year] ??= { year: String(year) };
    byYears[year][stat.categoryId] = stat.sum;
  }

  const chartData = years
    .map(year => byYears[year] ?? { year })
    .map(d => fillMissingForNumericKeys(d, cats));

  const keys = cats.map((key, i) => ({
    key,
    color: getChartColor(i, 0),
    dataId: Number(key),
    name: getFullCategoryName(Number(key), categoryMap),
  }));
  const result: ChartData<'year', number> = { chartData, keys };
  // If we are not estimating then we're done here
  if (!estimated) return result;

  const range = dateRangeToMomentRange(data.range);
  // Map chart data to add estimates (either as separate lines or merged into the chart data)
  return mapChartData(
    result,
    (k, i) => (separateEstimate ? [k, createEstimateKey(k, i)] : [k]),
    d =>
      createEstimationsForYear(d, result.chartData, data, Number(d.year), range, separateEstimate),
  );
}

const createEstimateKey = (k: ChartKeyInfo, i: number): ChartKeyInfo => ({
  key: `${k.key}i`,
  color: getChartColor(i, 3),
  name: `${k.name} (arvio)`,
  dataId: k.dataId,
  estimate: true,
});

function sumYears(catData: CategoryStatisticsData[]): YearlyDataItem[] {
  const byYears: Record<number, Omit<YearlyDataItem, 'sum'> & { sum: Money }> = {};
  for (const d of catData) {
    const year = Number(d.month.substring(0, 4));
    byYears[year] ??= { year, categoryId: d.categoryId, sum: new Money(0) };
    byYears[year].sum = byYears[year].sum.plus(d.sum);
  }
  return Object.values(byYears).map<YearlyDataItem>(v => ({
    ...v,
    sum: v.sum.valueOf(),
  }));
}

function createEstimationsForYear(
  column: ChartColumn<'year', number>,
  chartData: ChartColumn<'year', number>[],
  data: CategoryStatistics,
  year: number,
  range: MomentRange,
  separateEstimate: boolean,
): ChartColumn<'year', number> {
  const lastYear = toDayjs(data.range.endDate).year();
  const keys = typedKeys(data.statistics);

  if (year !== lastYear) {
    return separateEstimate
      ? { ...column, ...recordFromPairs(keys.map(k => [`${k}i`, 0])) }
      : column;
  }

  if (separateEstimate) {
    return {
      ...column,
      ...recordFromPairs(
        keys.map(k => [`${k}i`, estimateMissingYearlyExpenses(Number(k), data, chartData, range)]),
      ),
    };
  }

  const estimates = recordFromPairs(
    keys.map(k => [k, estimateMissingYearlyExpenses(Number(k), data, chartData, range)]),
  );

  return recordFromPairs(
    typedKeys(column).map(k => [k, k === 'year' ? column[k] : column[k] + estimates[k]]),
  ) as any;
}

export function createYearsChartConfiguration(
  props: CategoryGraphProps,
): ChartConfiguration<'year'> {
  const lastYear = props.data.range.endDate.substring(0, 4);
  return {
    convertData: categoryStatisticsToYearlyData,
    dataKey: 'year',
    tickFormatter: (year: string) =>
      props.estimated && !props.separateEstimate && year === lastYear ? `${year} (arvio)` : year,
  };
}
