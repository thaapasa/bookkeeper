import * as React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Category } from 'shared/types/Session';
import {
  CategoryStatistics,
  CategoryStatisticsData,
} from 'shared/types/Statistics';
import Money from 'shared/util/Money';
import { typedKeys } from 'shared/util/Objects';
import { getYearsInRange } from 'shared/util/TimeRange';
import { getFullCategoryName } from 'client/data/Categories';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney, formatMoneyThin, useThinFormat } from '../chart/Format';
import { Size } from '../Types';

export const YearsCategoryChart: React.FC<{
  statistics: CategoryStatistics;
  categoryMap: Record<string, Category>;
  size: Size;
}> = ({ statistics, size, categoryMap }) => {
  const { chartData, keys } = convertData(statistics);
  const nameFormat = useNameFormat(categoryMap);
  const thin = useThinFormat(size);
  return (
    <LineChart
      width={size.width}
      height={400}
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
      {keys.map(v => (
        <Line
          type="monotone"
          key={v.key}
          dataKey={v.key}
          stroke={v.color}
          name={nameFormat(v.key)}
        />
      ))}
    </LineChart>
  );
};

function useNameFormat(categoryMap: Record<string, Category>) {
  return React.useCallback(
    (key: string) => getFullCategoryName(Number(key), categoryMap),
    [categoryMap]
  );
}

const ChartMargins = { left: 16, top: 32, right: 48, bottom: 0 };

interface YearlyDataItem {
  year: number;
  sum: number;
  categoryId: number;
}

type YearlyData = { year: number } & Record<number, number>;

function convertData(data: CategoryStatistics) {
  const keys = typedKeys(data.statistics);
  const years = getYearsInRange(data.range);
  const summedYears = keys.map(catId => sumYears(data.statistics[catId]));
  const allData = summedYears.flat(1);

  const byYears: Record<number, YearlyData> = {};

  for (const stat of allData) {
    const year = stat.year;
    byYears[year] ??= { year };
    byYears[year][stat.categoryId] = stat.sum;
  }

  return {
    chartData: years
      .map(year => byYears[year] ?? { year })
      .map(d => fillMissing(d, keys)),
    keys: keys.map((key, i) => ({ key, color: getChartColor(i, 0) })),
  };
}

function fillMissing(data: YearlyData, keys: string[]) {
  for (const k of keys) {
    data[Number(k)] ??= 0;
  }
  return data;
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
