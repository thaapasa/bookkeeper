import { scaleBand, scaleLinear } from 'd3-scale';
import * as React from 'react';

import Money from 'shared/util/Money';

import { Axes } from '../chart/Axes';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';
import { usePersistentMemo } from '../utils/usePersistentMemo';
import { CategoryBars } from './CategoryBars';

export interface CategoryChartData {
  categoryId: number;
  categoryName: string;
  categoryTotal: number;
}

interface CategoryChartProps {
  chartData: CategoryChartData[] | undefined;
  size: Size;
}

const ChartMargins = { top: 50, right: 20, bottom: 80, left: 60 };

const CategoryChartImpl: React.FC<CategoryChartProps> = ({
  chartData,
  size,
}) => {
  const xScaleP = usePersistentMemo(() => scaleBand<string>(), []);
  const yScaleP = usePersistentMemo(() => scaleLinear<number>(), []);

  const containerWidth = size.width;

  const margins = ChartMargins;
  const width = Math.min(
    (chartData && chartData.length * 90) || 3000,
    containerWidth
  );
  const svgDimensions = React.useMemo(
    () => ({ width: Math.max(width, 300), height: 500 }),
    [width]
  );

  const maxValue = chartData
    ? Math.max(...chartData.map(d => Money.toValue(d.categoryTotal))) * 1.1
    : 0;

  const xScale = chartData
    ? xScaleP
        .padding(0.5)
        .domain(chartData.map(d => d.categoryName))
        .range([margins.left, svgDimensions.width - margins.right])
    : xScaleP;

  const yScale = yScaleP
    // scaleLinear domain required at least two values, min and max
    .domain([0, maxValue])
    .range([svgDimensions.height - margins.bottom, margins.top]);

  return (
    <svg width={svgDimensions.width} height={svgDimensions.height}>
      <Axes
        scales={{ xScale, yScale }}
        margins={margins}
        svgDimensions={svgDimensions}
      />
      <CategoryBars
        scales={{ xScale, yScale }}
        margins={margins}
        data={chartData}
        svgDimensions={svgDimensions}
      />
    </svg>
  );
};

export const CategoryChart = MeasureSize(CategoryChartImpl);
