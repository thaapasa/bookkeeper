import { AxisScale } from 'd3-axis';
import { scaleBand } from 'd3-scale';
import * as React from 'react';

import { typedKeys } from 'shared/util/Objects';

import {
  ChartDataColumn,
  ChartDataLine,
  CommonChartProps,
  Domain,
} from './types';

interface DataBarsProps<X extends Domain> extends CommonChartProps<X> {
  data: ChartDataLine<X>[];
}

export const DataBars: React.FC<DataBarsProps<any>> = <X extends Domain>({
  data,
  margins,
  ...rest
}: DataBarsProps<X>) => {
  const grouped = React.useMemo(() => byDomain(data), [data]);
  const keys = typedKeys(grouped);
  const allKeys = grouped[keys[0]].values.map(v => v.key);

  const xSubgroup = scaleBand<string>()
    .domain(allKeys)
    .range([0, rest.scales.xScale.bandwidth?.() ?? allKeys.length]);

  return (
    <>
      {keys.map(k => (
        <DataBarGroup
          key={k}
          data={grouped[k]}
          transform={`translate(${
            (rest.scales.xScale(Number(k) as any) || 0) +
            margins.left +
            (rest.scales.xScale.bandwidth?.() ?? 0) / 2
          },0)`}
          xSubScale={xSubgroup}
          margins={margins}
          {...rest}
        />
      ))}
    </>
  );
};

interface DataBarGroupProps<X extends Domain> extends CommonChartProps<X> {
  data: ChartDataColumn<X>;
  transform: string;
  xSubScale: AxisScale<string>;
}

export const DataBarGroup: React.FC<DataBarGroupProps<any>> = <
  X extends Domain
>({
  data,
  scales: { yScale },
  xSubScale,
  svgDimensions: { height },
  transform,
  margins,
}: DataBarGroupProps<X>) => {
  return (
    <g transform={transform}>
      {data.values.map(d => (
        <rect
          key={d.key}
          x={xSubScale(d.key) || 0}
          y={yScale(d.value) || 0}
          height={height - (yScale(d.value) || 0) - margins.bottom}
          width={xSubScale.bandwidth?.() ?? 1}
          fill={d.color}
        />
      ))}
    </g>
  );
};

function byDomain<X extends Domain>(
  data: ChartDataLine<X>[]
): Record<X, ChartDataColumn<X>> {
  const res: Record<X, ChartDataColumn<X>> = {} as any;

  data.forEach(line => {
    const { key, color, ...rest } = line;
    typedKeys(rest).map(l => {
      if (l !== 'key' && l !== 'color') {
        res[l] ??= { domain: l, values: [] };
        res[l].values.push({ key, color: line.color, value: rest[l] ?? 0 });
      }
    });
  });
  return res;
}
