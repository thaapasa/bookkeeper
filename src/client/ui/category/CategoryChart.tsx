import { Box } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';

import { getChartColor } from '../chart/ChartColors';
import { chartTooltipStyle, formatMoney, formatMoneyThin, useThinFormat } from '../chart/Format';

export interface CategoryChartData {
  categoryId: number;
  categoryName: string;
  categoryExpense: number;
  categoryIncome: number;
}

export const CategoryChart: React.FC<{
  chartData: CategoryChartData[] | undefined;
}> = ({ chartData }) => {
  const { ref, width, height } = useElementSize();
  return (
    <Box ref={ref} display="flex" flex={1} style={{ minWidth: 0 }}>
      {width > 0 ? <CategoryChartContent chartData={chartData} size={{ width, height }} /> : null}
    </Box>
  );
};

const CategoryChartContent: React.FC<{
  chartData: CategoryChartData[] | undefined;
  size: { width: number; height: number };
}> = ({ chartData, size }) => {
  const thin = useThinFormat(size);
  const expenseColor = 10;
  const incomeColor = 0;
  return (
    <BarChart width={size.width} height={size.height} data={chartData} margin={ChartMargins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="categoryName" />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoney}
        width={thin ? 16 : undefined}
        dataKey="categoryExpense"
        yAxisId="expense"
        orientation="left"
        style={{ fill: getChartColor(expenseColor, 0) }}
      />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoney}
        width={thin ? 16 : undefined}
        dataKey="categoryIncome"
        yAxisId="income"
        orientation="right"
        style={{ fill: getChartColor(incomeColor, 0) }}
      />
      <Tooltip
        formatter={v => formatMoney(typeof v === 'number' ? v : 0)}
        cursor={{ fill: 'var(--mantine-color-default-hover)' }}
        contentStyle={chartTooltipStyle}
      />
      <Legend />
      <Bar
        dataKey="categoryExpense"
        fill={getChartColor(expenseColor, 2)}
        name="Menot"
        yAxisId="expense"
      />
      <Bar
        dataKey="categoryIncome"
        fill={getChartColor(incomeColor, 2)}
        name="Tulot"
        yAxisId="income"
      />
    </BarChart>
  );
};

const ChartMargins = { left: 24, top: 32, right: 24, bottom: 0 };
