import * as React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney, formatMoneyThin, useThinFormat } from '../chart/Format';
import { Size } from '../Types';
import { MeasureSize } from '../utils/MeasureSize';

export interface CategoryChartData {
  categoryId: number;
  categoryName: string;
  categoryExpense: number;
  categoryIncome: number;
}

interface CategoryChartProps {
  chartData: CategoryChartData[] | undefined;
  size: Size;
  className?: string;
}

const CategoryChartImpl: React.FC<CategoryChartProps> = ({ chartData, size, className }) => {
  const thin = useThinFormat(size);
  const expenseColor = 0;
  const incomeColor = 1;
  return (
    <BarChart width={size.width} height={size.height} data={chartData} margin={ChartMargins} className={className}>
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
      <Tooltip formatter={formatMoney} />
      <Legend />
      <Bar dataKey="categoryExpense" fill={getChartColor(expenseColor, 2)} name="Menot" yAxisId="expense" />
      <Bar dataKey="categoryIncome" fill={getChartColor(incomeColor, 2)} name="Tulot" yAxisId="income" />
    </BarChart>
  );
};

const ChartMargins = { left: 24, top: 32, right: 24, bottom: 0 };

export const CategoryChart = MeasureSize(CategoryChartImpl);
