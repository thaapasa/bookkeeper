import * as React from 'react';

import { CommonChartProps } from '../chart/types';
import { CategoryChartData } from './CategoryChart';

interface BarsProps extends CommonChartProps {
  data?: CategoryChartData[];
}

export const CategoryBars: React.FC<BarsProps> = ({
  scales: { xScale, yScale },
  margins,
  data,
  svgDimensions: { height },
}) => (
  <g>
    {data ? (
      data.map(datum => (
        <rect
          key={datum.categoryName}
          x={xScale(datum.categoryName)}
          y={yScale(datum.categoryTotal)}
          height={height - margins.bottom - (yScale(datum.categoryTotal) || 0)}
          width={xScale.bandwidth ? xScale.bandwidth() : 0}
          fill="#A252B6"
        />
      ))
    ) : (
      <rect />
    )}
  </g>
);
