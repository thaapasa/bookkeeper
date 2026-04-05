import { Box } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import * as React from 'react';
import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';

import { isDefined, ObjectId } from 'shared/types';

import { getChartColor } from '../chart/ChartColors';
import { chartTooltipStyle, formatMoney, formatMoneyForChart } from '../chart/Format';

export interface TotalsData {
  name: string;
  sum: number;
  categoryId?: ObjectId;
  colorIndex: number;
}

export const TotalsChart: React.FC<{
  data: TotalsData[];
  onSelectCategory: (categoryId?: ObjectId) => void;
  colorIndex?: number;
}> = ({ data, onSelectCategory, colorIndex }) => {
  const { ref, width } = useElementSize();
  return (
    <Box ref={ref} display="flex" flex={1} style={{ minWidth: 0 }}>
      {width > 0 ? (
        <PieChart width={width} height={300}>
          <Pie
            data={data}
            dataKey="sum"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={d => formatMoney((d.payload as TotalsData)?.sum ?? 0)}
            onClick={data => onSelectCategory((data as unknown as TotalsData).categoryId)}
          >
            {data.map((d, i) => (
              <Cell
                key={`cell-${i}`}
                fill={
                  isDefined(colorIndex)
                    ? getChartColor(colorIndex, i)
                    : getChartColor(d.colorIndex, 1)
                }
              />
            ))}
          </Pie>
          <Tooltip formatter={formatMoneyForChart} contentStyle={chartTooltipStyle} />
          <Legend layout="vertical" align="right" />
        </PieChart>
      ) : null}
    </Box>
  );
};
