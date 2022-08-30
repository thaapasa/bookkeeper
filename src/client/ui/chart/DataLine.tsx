import { curveBumpX } from 'd3';
import { select as d3Select } from 'd3-selection';
import { line } from 'd3-shape';
import * as React from 'react';

import { CommonChartProps } from './types';

interface DataLineProps<Domain> extends CommonChartProps<Domain> {
  data: [number, number][];
  color: string;
}

// See examples of data curve from https://observablehq.com/@d3/d3-line

export const DataLine: React.FC<DataLineProps<any>> = ({
  data,
  scales: { xScale, yScale },
  color,
}) => {
  const xOffs = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
  const ref = React.useRef<SVGPathElement>(null);
  const valueLine = line()
    .curve(curveBumpX)
    .x(v => xOffs + (xScale(String(v[0] + 1)) ?? 0))
    .y(v => yScale(v[1]) ?? 0);

  React.useEffect(() => {
    if (ref.current) {
      d3Select(ref.current)
        .data([data])
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.2)
        .attr('d', valueLine);
    }
  });
  return <path ref={ref} />;
};
