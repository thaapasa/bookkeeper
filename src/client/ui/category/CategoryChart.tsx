import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney, formatMoneyThin, useThinFormat } from '../chart/Format';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';

export interface CategoryChartData {
  categoryId: number;
  categoryName: string;
  categoryTotal: number;
}

interface CategoryChartProps {
  chartData: CategoryChartData[] | undefined;
  size: Size;
}

const CategoryChartImpl: React.FC<CategoryChartProps> = ({
  chartData,
  size,
}) => {
  const thin = useThinFormat(size);
  return (
    <BarChart
      width={size.width}
      height={300}
      data={chartData}
      margin={ChartMargins}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="categoryName" />
      <YAxis
        tickFormatter={thin ? formatMoneyThin : formatMoney}
        width={thin ? 16 : undefined}
      />
      <Tooltip formatter={formatMoney} />
      <Legend />
      <Bar dataKey="categoryTotal" fill={getChartColor(0, 1)} name="Summa" />
    </BarChart>
  );
};

const ChartMargins = { left: 32, top: 32, right: 32, bottom: 0 };

export const CategoryChart = MeasureSize(CategoryChartImpl);
