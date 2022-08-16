import { curveBumpX } from 'd3';
import { select as d3Select } from 'd3-selection';
import { line } from 'd3-shape';
import * as React from 'react';

import { CommonChartProps } from './types';

type DataPoint = [number, number];

// See examples of data curve from https://observablehq.com/@d3/d3-line

export const DataLine: React.FC<
  CommonChartProps & {
    values: DataPoint[];
    maxKey: number;
    color: string;
  }
> = ({ values, scales: { xScale, yScale }, color }) => {
  const xOffs = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
  const ref = React.useRef<SVGPathElement>(null);
  const valueLine = line()
    .curve(curveBumpX)
    .x(v => xOffs + (xScale(String(v[0])) ?? 0))
    .y(v => yScale(v[1]) ?? 0);

  React.useEffect(() => {
    if (ref.current) {
      d3Select(ref.current)
        .data([values])
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.2)
        .attr('d', valueLine);
    }
  });
  return <path ref={ref} />;
};
