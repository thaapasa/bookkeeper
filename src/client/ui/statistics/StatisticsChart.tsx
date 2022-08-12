import * as d3Axis from 'd3-axis';
import { scaleBand, scaleLinear } from 'd3-scale';
import * as React from 'react';

import { CategoryStatistics } from 'shared/types/Statistics';

import { Axes } from '../chart/Axes';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';

const StatisticsChartImpl: React.FC<{
  statistics: CategoryStatistics;
  size: Size;
}> = ({ statistics, size }) => {
  const xScaleP = React.useMemo(() => scaleBand<string>(), []);
  const yScaleP = React.useMemo(() => scaleLinear<number>(), []);

  const { width } = size;

  const chartData = statistics;
  const margins = { top: 50, right: 20, bottom: 80, left: 60 };
  const svgDimensions = {
    width: Math.max(width, 300),
    height: 500,
  };

  const maxValue = 10000;

  const xScale: d3Axis.AxisScale<string> = chartData
    ? xScaleP
        .padding(0.5)
        .domain(['Tammi', 'Helmi', 'Maalis'])
        .range([margins.left, svgDimensions.width - margins.right])
    : xScaleP;

  // scaleLinear type
  const yScale: d3Axis.AxisScale<number> = yScaleP
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
    </svg>
  );
};

export const StatisticsChart = MeasureSize(StatisticsChartImpl);
