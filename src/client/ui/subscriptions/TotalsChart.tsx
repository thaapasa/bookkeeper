import * as React from 'react';
import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';

import { isDefined, ObjectId } from 'shared/types';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney } from '../chart/Format';
import { Size } from '../Types';
import { MeasureSize } from '../utils/MeasureSize';

export interface TotalsData {
  name: string;
  sum: number;
  categoryId?: ObjectId;
}

const TotalsChartImpl: React.FC<{
  data: TotalsData[];
  size: Size;
  onSelectCategory: (categoryId?: ObjectId) => void;
  colorIndex?: number;
}> = ({ data, size, onSelectCategory, colorIndex }) => (
  <PieChart width={size.width} height={300} title="Kukkeliskuu">
    <Pie
      data={data}
      dataKey="sum"
      nameKey="name"
      cx="50%"
      cy="50%"
      outerRadius={90}
      label={d => formatMoney(d.sum)}
      onClick={data => onSelectCategory(data.categoryId)}
    >
      {data.map((_d, i) => (
        <Cell
          key={i}
          fill={
            isDefined(colorIndex)
              ? getChartColor(colorIndex, i)
              : getChartColor(i, 0)
          }
        />
      ))}
    </Pie>
    <Tooltip formatter={formatMoney} />
    <Legend />
  </PieChart>
);

export const TotalsChart = MeasureSize(TotalsChartImpl);
