import * as d3Axis from 'd3-axis';

export interface ChartScales<XDomain> {
  xScale: d3Axis.AxisScale<XDomain>;
  yScale: d3Axis.AxisScale<number>;
}

export interface ChartMargins {
  bottom: number;
  top: number;
  left: number;
  right: number;
}

export type ChartOrient = 'Bottom' | 'Left' | 'Top' | 'Right';

export interface CommonChartProps<XDomain> {
  scales: ChartScales<XDomain>;
  margins: ChartMargins;
  svgDimensions: { height: number; width: number };
  maxValue: number;
}
