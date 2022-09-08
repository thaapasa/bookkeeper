import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { ObjectId } from 'shared/types/Id';
import { Category } from 'shared/types/Session';
import {
  CategoryStatistics,
  CategoryStatisticsData,
} from 'shared/types/Statistics';
import Money from 'shared/util/Money';
import { recordFromPairs, typedKeys } from 'shared/util/Objects';
import { toMoment } from 'shared/util/Time';
import {
  dateRangeToMomentRange,
  getYearsInRange,
  MomentRange,
} from 'shared/util/TimeRange';
import { getFullCategoryName } from 'client/data/Categories';
import { getChartColor } from 'client/ui/chart/ChartColors';
import { calculateChartHeight } from 'client/ui/chart/ChartSize';
import { fillMissingForNumericKeys } from 'client/ui/chart/ChartTools';
import {
  ChartColumn,
  ChartColumnData,
  ChartData,
} from 'client/ui/chart/ChartTypes';
import {
  formatMoney,
  formatMoneyThin,
  useThinFormat,
} from 'client/ui/chart/Format';

import { EmptyChart } from '../EmptyChart';
import { CategoryGraphProps } from './CategoryStatisticsChart';
import { estimateMissingYearlyExpenses } from './ExpenseEstimation';

export const YearsCategoryChart: React.FC<CategoryGraphProps> = ({
  data,
  size,
  categoryMap,
  stacked,
  estimated,
}) => {
  const { chartData, keys } = React.useMemo(
    () => convertData(data, categoryMap, estimated),
    [data, categoryMap, estimated]
  );
  const thin = useThinFormat(size);
  const ChartContainer = stacked ? AreaChart : LineChart;

  if (keys.length < 1) return <EmptyChart />;
  return (
    <ChartContainer
      width={size.width}
      height={calculateChartHeight(keys.length)}
      data={chartData}
      margin={ChartMargins}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoney}
        width={thin ? 32 : undefined}
      />
      <Tooltip formatter={formatMoney} />
      <Legend />
      {keys.map(v =>
        stacked ? (
          <Area
            type="monotone"
            key={v.key}
            dataKey={v.key}
            strokeDasharray={v.estimate ? '3 3' : undefined}
            stroke={v.color}
            fill={`${v.color}77`}
            stackId={1}
            name={v.name ?? v.key}
          />
        ) : (
          <Line
            type="monotone"
            key={v.key}
            dataKey={v.key}
            stroke={v.color}
            name={v.name ?? v.key}
          />
        )
      )}
    </ChartContainer>
  );
};

const ChartMargins = { left: 16, top: 32, right: 48, bottom: 0 };

interface YearlyDataItem {
  year: number;
  sum: number;
  categoryId: number;
}

function convertData(
  data: CategoryStatistics,
  categoryMap: Record<ObjectId, Category>,
  estimated: boolean
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
    name: getFullCategoryName(Number(key), categoryMap),
  }));

  return !estimated
    ? { chartData, keys }
    : {
        chartData: addEstimated(chartData, data),
        keys: keys
          .map((k, i) => [
            k,
            {
              key: `${k.key}i`,
              color: getChartColor(i, 3),
              name: `${k.name} (arvio)`,
              estimate: true,
            },
          ])
          .flat(1),
      };
}

function sumYears(catData: CategoryStatisticsData[]): YearlyDataItem[] {
  const byYears: Record<number, Omit<YearlyDataItem, 'sum'> & { sum: Money }> =
    {};
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

function addEstimated(
  chartData: ChartColumn<'year', number>[],
  data: CategoryStatistics
): ChartColumn<'year', number>[] {
  const range = dateRangeToMomentRange(data.range);
  return chartData.map(d => ({
    ...d,
    ...createEstimationsForYear(chartData, data, Number(d.year), range),
  }));
}

function createEstimationsForYear(
  chartData: ChartColumn<'year', number>[],
  data: CategoryStatistics,
  year: number,
  range: MomentRange
): ChartColumnData<number> {
  const lastYear = toMoment(data.range.endDate).year();
  const keys = data.categoryIds;

  return recordFromPairs(
    keys.map(k => [
      `${k}i`,
      year !== lastYear
        ? 0
        : estimateMissingYearlyExpenses(k, data, chartData, range),
    ])
  );
}
