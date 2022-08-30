import * as d3Axis from 'd3-axis';

export type Domain = string | number;

export interface ChartScales<X extends Domain> {
  xScale: d3Axis.AxisScale<X>;
  yScale: d3Axis.AxisScale<number>;
}

export interface ChartMargins {
  bottom: number;
  top: number;
  left: number;
  right: number;
}

export type ChartOrient = 'Bottom' | 'Left' | 'Top' | 'Right';

export interface CommonChartProps<X extends Domain> {
  scales: ChartScales<X>;
  margins: ChartMargins;
  svgDimensions: { height: number; width: number };
  maxValue: number;
}

export type CommonChartDomain<P> = P extends CommonChartProps<infer D>
  ? D
  : never;

export type ChartDataLine<X extends Domain> = {
  key: string;
  color?: string;
} & Partial<Record<X, number>>;

export type ChartDataColumn<X extends Domain> = {
  domain: X;
  values: { key: string; color?: string; value: number }[];
};
