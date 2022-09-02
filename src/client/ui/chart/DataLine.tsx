import { curveBumpX } from 'd3';
import { select as d3Select } from 'd3-selection';
import { line } from 'd3-shape';
import * as React from 'react';

import { isDefined } from 'shared/types/Common';
import { typedKeys } from 'shared/util/Objects';

import { getChartColor } from './ChartColors';
import { ChartDataLine, CommonChartProps } from './types';

// See examples of data curve from https://observablehq.com/@d3/d3-line

export const DataLines: React.FC<
  CommonChartProps<number> & {
    data: ChartDataLine<number>[];
  }
> = ({ data, ...props }) => {
  return (
    <>
      {data.map((d, i) => (
        <DataLine key={i} {...props} index={i} data={d} />
      ))}
    </>
  );
};

const DataLine: React.FC<
  CommonChartProps<number> & {
    index: number;
    data: ChartDataLine<number>;
  }
> = ({ data, scales: { xScale, yScale }, index }) => {
  const xOffs = (xScale.bandwidth?.() ?? 0) / 2;
  const ref = React.useRef<SVGPathElement>(null);
  const color = data.color ?? getChartColor(index, 0);
  const values = typedKeys(data)
    .map<[number, number] | undefined>(k =>
      k !== 'key' && k !== 'color' ? [Number(k), data[k] ?? 0] : undefined
    )
    .filter(isDefined);
  const valueLine = line()
    .curve(curveBumpX)
    .x(v => xOffs + (xScale(v[0] + 1) ?? 0))
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
