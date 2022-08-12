import * as d3Axis from 'd3-axis';

export interface ChartScales {
  xScale: d3Axis.AxisScale<string>;
  yScale: d3Axis.AxisScale<number>;
}

export interface ChartMargins {
  bottom: number;
  top: number;
  left: number;
  right: number;
}

export type ChartOrient = 'Bottom' | 'Left' | 'Top' | 'Right';

export interface CommonChartProps {
  scales: ChartScales;
  margins: ChartMargins;
  svgDimensions: { height: number; width: number };
}
