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
import { CategoryStatistics } from 'shared/types/Statistics';
import Money from 'shared/util/Money';
import { typedKeys } from 'shared/util/Objects';
import { ISOMonth } from 'shared/util/Time';
import { getMonthsInRange } from 'shared/util/TimeRange';
import { getFullCategoryName } from 'client/data/Categories';
import { getChartColor } from 'client/ui/chart/ChartColors';
import { calculateChartHeight } from 'client/ui/chart/ChartSize';
import { fillMissingForNumericKeys } from 'client/ui/chart/ChartTools';
import { ChartColumn, ChartData } from 'client/ui/chart/ChartTypes';
import {
  formatMoney,
  formatMoneyThin,
  useThinFormat,
} from 'client/ui/chart/Format';

import { EmptyChart } from '../EmptyChart';
import { CategoryGraphProps } from './CategoryStatisticsChart';

export const MonthsCategoryChart: React.FC<CategoryGraphProps> = ({
  data,
  size,
  categoryMap,
  stacked,
}) => {
  const { chartData, keys } = React.useMemo(
    () => convertData(data, categoryMap),
    [data, categoryMap]
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
      <XAxis dataKey="month" tickFormatter={formatMonth} />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoney}
        width={thin ? 32 : undefined}
      />
      <Tooltip formatter={formatMoney} labelFormatter={formatMonth} />
      <Legend />
      {keys.map(v =>
        stacked ? (
          <Area
            type="monotone"
            key={v.key}
            dataKey={v.key}
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

function formatMonth(m: ISOMonth) {
  return m.replace('-', '/');
}

const ChartMargins = { left: 16, top: 32, right: 48, bottom: 0 };

function convertData(
  data: CategoryStatistics,
  categoryMap: Record<ObjectId, Category>
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
    chartData: allMonths
      .map(month => byMonths[month] ?? { month })
      .map(d => fillMissingForNumericKeys(d, keys)),
    keys: keys.map((key, i) => ({
      key,
      color: getChartColor(i, 0),
      name: getFullCategoryName(Number(key), categoryMap),
    })),
  };
}
