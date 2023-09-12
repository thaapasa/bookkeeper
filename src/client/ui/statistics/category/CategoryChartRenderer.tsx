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

import { calculateChartHeight } from 'client/ui/chart/ChartSize';
import {
  formatMoney,
  formatMoneyThin,
  useThinFormat,
} from 'client/ui/chart/Format';

import { EmptyChart } from '../EmptyChart';
import { CategoryGraphProps } from './CategoryStatisticsChart';
import { ChartConfiguration } from './ChartTypes';
import { getChartMargins } from './Common';

type CategoryChartProps<T extends string> = CategoryGraphProps &
  ChartConfiguration<T>;

export const CategoryChartRenderer: React.FC<CategoryChartProps<any>> = <
  T extends string,
>({
  convertData,
  size,
  data,
  stacked,
  estimated,
  separateEstimate,
  stackMainCats,
  categoryMap,
  dataKey,
  tickFormatter,
  labelFormatter,
}: CategoryChartProps<T>) => {
  const { chartData, keys } = React.useMemo(
    () => convertData(data, categoryMap, estimated, separateEstimate),
    [convertData, data, categoryMap, estimated, separateEstimate]
  );
  const thin = useThinFormat(size);
  const ChartContainer = stacked ? AreaChart : LineChart;

  if (keys.length < 1) return <EmptyChart />;
  return (
    <ChartContainer
      width={size.width}
      height={calculateChartHeight(keys.length)}
      data={chartData}
      margin={getChartMargins(size)}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={dataKey} tickFormatter={tickFormatter} />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoney}
        width={thin ? 32 : undefined}
      />
      <Tooltip formatter={formatMoney} labelFormatter={labelFormatter} />
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
            stackId={
              stackMainCats ? categoryMap[v.dataId].parentId ?? v.dataId : 1
            }
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
