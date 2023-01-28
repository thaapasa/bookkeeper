import * as React from 'react';
import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';

import { getChartColor } from '../chart/ChartColors';
import { formatMoney } from '../chart/Format';
import { Size } from '../Types';
import { MeasureSize } from '../utils/MeasureSize';

export interface TotalsData {
  name: string;
  sum: number;
}

const TotalsChartImpl: React.FC<{
  data: TotalsData[];
  size: Size;
}> = ({ data, size }) => (
  <PieChart width={size.width} height={300} title="Kukkeliskuu">
    <Pie
      data={data}
      dataKey="sum"
      nameKey="name"
      cx="50%"
      cy="50%"
      outerRadius={90}
      label={d => formatMoney(d.sum)}
    >
      {data.map((_d, i) => (
        <Cell key={i} fill={getChartColor(i, 0)} />
      ))}
    </Pie>
    <Tooltip formatter={formatMoney} />
    <Legend />
  </PieChart>
);

export const TotalsChart = MeasureSize(TotalsChartImpl);
