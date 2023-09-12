import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import { dateRangeToMomentRange, getYearsInRange, MomentRange } from 'shared/time';
import { Category, CategoryStatistics, ObjectId } from 'shared/types';
import { leftPad, Money, numberRange, typedKeys } from 'shared/util';
import { getFullCategoryName } from 'client/data/Categories';
import { getChartColor } from 'client/ui/chart/ChartColors';
import { calculateChartHeight } from 'client/ui/chart/ChartSize';
import { ChartColumn, ChartData } from 'client/ui/chart/ChartTypes';
import { formatMoney, formatMoneyThin, useThinFormat } from 'client/ui/chart/Format';

import { EmptyChart } from '../EmptyChart';
import { Months } from '../types';
import { CategoryGraphProps } from './CategoryStatisticsChart';
import { getChartMargins } from './Common';

const useLines = true;

export const YearlyRecurringCategoryChart: React.FC<CategoryGraphProps> = ({ data, size, categoryMap }) => {
  const { chartData, keys } = React.useMemo(
    () => categoryStatisticsToYearlyRecurring(data, categoryMap),
    [data, categoryMap],
  );
  const thin = useThinFormat(size);
  const ChartContainer = useLines ? LineChart : BarChart;

  if (keys.length < 1) return <EmptyChart />;
  return (
    <ChartContainer
      width={size.width}
      height={calculateChartHeight(keys.length)}
      data={chartData}
      margin={getChartMargins(size)}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis tickFormatter={thin ? formatMoneyThin : formatMoney} width={thin ? 32 : undefined} />
      {keys.length <= 12 ? <Tooltip formatter={formatMoney} /> : null}
      <Legend />
      {keys.map(v =>
        useLines ? (
          <Line type="monotone" key={v.key} dataKey={v.key} stroke={v.color} name={v.name ?? v.key} />
        ) : (
          <Bar key={v.key} dataKey={v.key} fill={v.color} name={v.name ?? v.key} />
        ),
      )}
    </ChartContainer>
  );
};

function categoryStatisticsToYearlyRecurring(
  data: CategoryStatistics,
  categoryMap: Record<ObjectId, Category>,
): ChartData<'month', string> {
  const keys = typedKeys(data.statistics);
  const range = dateRangeToMomentRange(data.range);
  const years = getYearsInRange(data.range);

  const chartData = numberRange(0, 11).map(m => findEntriesForMonth(data, m, keys, range, years));
  return {
    chartData,
    keys: keys
      .map((k, i) =>
        years.map(y => ({
          key: `${k}-${y}`,
          color: getChartColor(i, years[years.length - 1] - y),
          name: `${getFullCategoryName(Number(k), categoryMap)} (${y})`,
          dataId: Number(k),
        })),
      )
      .flat(1),
  };
}

function findEntriesForMonth(
  data: CategoryStatistics,
  month: number,
  keys: string[],
  range: MomentRange,
  years: number[],
): ChartColumn<'month', string> {
  const monthData: ChartColumn<'month', string> = {
    month: Months[month],
  } as any;
  for (const key of keys) {
    for (const year of years) {
      if (range.endTime.isAfter(`${year}-${leftPad(month + 1, 2, '0')}-01`)) {
        monthData[`${key}-${year}`] = Money.from(
          data.statistics[key].find(p => p.month === `${year}-${leftPad(month + 1, 2, '0')}`)?.sum ?? '0',
        ).valueOf();
      }
    }
  }
  return monthData;
}
