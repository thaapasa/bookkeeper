import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';

import { CategoryStatistics } from 'shared/types/Statistics';
import { numberRange } from 'shared/util/Arrays';
import Money from 'shared/util/Money';
import { typedKeys } from 'shared/util/Objects';
import { dateRangeToMomentRange, MomentRange } from 'shared/util/TimeRange';
import { leftPad } from 'shared/util/Util';

import { getChartColor } from '../chart/ChartColors';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';
import { Months } from './types';

const StatisticsBarGraph: React.FC<{
  statistics: CategoryStatistics;
  size: Size;
}> = ({ statistics, size }) => {
  const { chartData, keys } = convertData(statistics);
  return (
    <BarChart
      width={size.width}
      height={300}
      data={chartData}
      margin={ChartMargins}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Legend />
      {keys.map(v => (
        <Bar key={v.key} dataKey={v.key} fill={v.color} name={v.key} />
      ))}
    </BarChart>
  );
};

export const StatisticsChart = MeasureSize(StatisticsBarGraph);

const ChartMargins = { left: 0, top: 32, right: 32, bottom: 0 };

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
      monthData[`${key}-${year}`] = Money.from(
        data.statistics[key].find(
          p => p.month === `${year}-${leftPad(month + 1, 2, '0')}`
        )?.sum ?? '0'
      ).valueOf();
    }
  }
  return monthData;
}
