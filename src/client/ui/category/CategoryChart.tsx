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

import Money from 'shared/util/Money';

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
  const thin = size.width < 550;
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
        tickFormatter={thin ? formatThin : formatMoney}
        width={thin ? 16 : undefined}
      />
      <Tooltip formatter={formatMoney} />
      <Legend />
      <Bar dataKey="categoryTotal" fill="#A252B6" name="Summa" />
    </BarChart>
  );
};

const formatThin = (v: number) =>
  v > 1000 ? `${Math.round(v / 1000)}K` : `${v}`;
const ChartMargins = { left: 32, top: 32, right: 32, bottom: 0 };
const formatMoney = (v: number) => Money.from(v).format();

export const CategoryChart = MeasureSize(CategoryChartImpl);
