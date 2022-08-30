import { colors } from '@mui/material';
import { scaleBand, scaleOrdinal, stackOffsetNone, stackOrderNone } from 'd3';
import { select as d3Select } from 'd3-selection';
import { stack } from 'd3-shape';
import * as React from 'react';

import { ISOMonth } from 'shared/util/Time';
import { identity } from 'shared/util/Util';

import { CommonChartProps } from './types';

type HasKeys<T extends string> = { [K in T]: number };

interface DataBarsProps<T extends string, D extends HasKeys<T>>
  extends CommonChartProps<ISOMonth> {
  keys: T[];
  data: D[];
}

export const DataBars: React.FC<DataBarsProps<any, any>> = <
  T extends string,
  D extends HasKeys<T>
>({
  keys,
  data,
  scales: { xScale, yScale },
}: DataBarsProps<T, D>) => {
  const xOffs = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
  const ref = React.useRef<SVGGElement>(null);
  const valueStack = stack()
    .keys(keys)
    .order(stackOrderNone)
    .offset(stackOffsetNone);
  const series = valueStack(data);

  const xScale = scaleBand(keys, xRange).padding(xPadding);
  const yScale = yType(yDomain, yRange);

  const color = scaleOrdinal()
    .domain(keys)
    .range(['#e41a1c', '#377eb8', '#4daf4a']);

  React.useEffect(() => {
    d3Select(ref.current)
      .data(series)
      .enter()
      .append('g')
      .attr('fill', colors.blue['300'])
      .selectAll('rect')
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(identity)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d.data.group))
      .attr('y', d => yScale(d[1]))
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('width', xScale.bandwidth?.() ?? 1);
  });

  return <g ref={ref} />;
};
