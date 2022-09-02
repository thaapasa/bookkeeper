import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Category } from 'shared/types/Session';
import { CategoryStatistics } from 'shared/types/Statistics';
import { numberRange } from 'shared/util/Arrays';
import Money from 'shared/util/Money';
import { typedKeys } from 'shared/util/Objects';
import { dateRangeToMomentRange, MomentRange } from 'shared/util/TimeRange';
import { leftPad } from 'shared/util/Util';
import { getFullCategoryName } from 'client/data/Categories';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney, formatMoneyThin, useThinFormat } from '../chart/Format';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';
import { Months } from './types';

const useLines = true;

const StatisticsGraph: React.FC<{
  statistics: CategoryStatistics;
  categoryMap: Record<string, Category>;
  size: Size;
}> = ({ statistics, size, categoryMap }) => {
  const { chartData, keys } = convertData(statistics);
  const nameFormat = useNameFormat(categoryMap);
  const thin = useThinFormat(size);
  const ChartContainer = useLines ? LineChart : BarChart;
  return (
    <ChartContainer
      width={size.width}
      height={400}
      data={chartData}
      margin={ChartMargins}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoney}
        width={thin ? 32 : undefined}
      />
      {keys.length <= 12 ? <Tooltip formatter={formatMoney} /> : null}
      <Legend />
      {keys.map(v =>
        useLines ? (
          <Line
            type="monotone"
            key={v.key}
            dataKey={v.key}
            stroke={v.color}
            name={nameFormat(v.key)}
          />
        ) : (
          <Bar
            key={v.key}
            dataKey={v.key}
            fill={v.color}
            name={nameFormat(v.key)}
          />
        )
      )}
    </ChartContainer>
  );
};

function useNameFormat(categoryMap: Record<string, Category>) {
  return React.useCallback(
    (key: string) => {
      const [cat, year] = key.split('-');
      return `${getFullCategoryName(Number(cat), categoryMap)} (${year})`;
    },
    [categoryMap]
  );
}

export const StatisticsChart = MeasureSize(StatisticsGraph);

const ChartMargins = { left: 16, top: 32, right: 48, bottom: 0 };

function convertData(data: CategoryStatistics) {
  const keys = typedKeys(data.statistics);
  const range = dateRangeToMomentRange(data.range);
  const years = numberRange(range.startTime.year(), range.endTime.year());

  const chartData = numberRange(0, 11).map(m =>
    findEntriesForMonth(data, m, keys, range, years)
  );
  return {
    chartData,
    keys: keys
      .map((k, i) =>
        years.map(y => ({
          key: `${k}-${y}`,
          color: getChartColor(i, years[years.length - 1] - y),
        }))
      )
      .flat(1),
  };
}

function findEntriesForMonth(
  data: CategoryStatistics,
  month: number,
  keys: string[],
  range: MomentRange,
  years: number[]
) {
  const monthData: Record<string, any> = { month: Months[month] };
  for (const key of keys) {
    for (const year of years) {
      if (range.endTime.isAfter(`${year}-${leftPad(month + 1, 2, '0')}-01`)) {
        monthData[`${key}-${year}`] = Money.from(
          data.statistics[key].find(
            p => p.month === `${year}-${leftPad(month + 1, 2, '0')}`
          )?.sum ?? '0'
        ).valueOf();
      }
    }
  }
  return monthData;
}
