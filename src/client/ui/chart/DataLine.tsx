import { interpolateNumber } from 'd3-interpolate';
import { select as d3Select } from 'd3-selection';
import { line } from 'd3-shape';
import * as React from 'react';

import { ChartScales } from '../chart/types';

export const DataLine: React.FC<{
  values: [number, number][];
  scales: ChartScales;
  maxValue: number;
  maxKey: number;
}> = ({ values, scales: { xScale, yScale }, maxKey, maxValue }) => {
  const [x1, x2] = xScale.range();
  const [y1, y2] = yScale.range();
  const xscale = interpolateNumber(x1, x2);
  const yscale = interpolateNumber(y1, y2);
  const ref = React.useRef<SVGPathElement>(null);
  const valueLine = line()
    .x(v => xscale(v[0] / maxKey))
    .y(v => yscale(v[1] / maxValue));

  React.useEffect(() => {
    if (ref.current) {
      d3Select(ref.current)
        .data([values])
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', valueLine);
    }
  });
  return <path ref={ref} />;
};
