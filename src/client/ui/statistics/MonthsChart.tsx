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
import { CategoryStatistics } from 'shared/types/Statistics';
import Money from 'shared/util/Money';
import { typedKeys } from 'shared/util/Objects';
import { ISOMonth } from 'shared/util/Time';
import { getMonthsInRange } from 'shared/util/TimeRange';
import { getFullCategoryName } from 'client/data/Categories';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney, formatMoneyThin, useThinFormat } from '../chart/Format';
import { Size } from '../Types';

export const MonthsCategoryChart: React.FC<{
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
      <XAxis dataKey="month" tickFormatter={formatMonth} />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoney}
        width={thin ? 32 : undefined}
      />
      <Tooltip formatter={formatMoney} labelFormatter={formatMonth} />
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

function formatMonth(m: ISOMonth) {
  return m.replace('-', '/');
}

function useNameFormat(categoryMap: Record<string, Category>) {
  return React.useCallback(
    (key: string) => getFullCategoryName(Number(key), categoryMap),
    [categoryMap]
  );
}

const ChartMargins = { left: 16, top: 32, right: 48, bottom: 0 };

type MonthlyData = { month: ISOMonth } & Record<number, number>;

function convertData(data: CategoryStatistics) {
  const keys = typedKeys(data.statistics);
  const allMonths = getMonthsInRange(data.range);
  const allData = Object.values(data.statistics).flat(1);

  const byMonths: Record<ISOMonth, MonthlyData> = {};
  for (const stat of allData) {
    const month = stat.month;
    byMonths[month] ??= { month };
    byMonths[month][stat.categoryId] = Money.from(stat.sum).valueOf();
  }

  return {
    chartData: allMonths
      .map(month => byMonths[month] ?? { month })
      .map(d => fillMissing(d, keys)),
    keys: keys.map((key, i) => ({ key, color: getChartColor(i, 0) })),
  };
}

function fillMissing(data: MonthlyData, keys: string[]) {
  for (const k of keys) {
    data[Number(k)] ??= 0;
  }
  return data;
}
