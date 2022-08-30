import * as React from 'react';

import { typedKeys } from 'shared/util/Objects';

import { CommonChartProps } from './types';

interface DataBarsProps<Domain extends string>
  extends CommonChartProps<Domain> {
  data: Record<Domain, number>;
}

export const DataBars: React.FC<DataBarsProps<any>> = <Domain extends string>({
  data,
  margins,
  svgDimensions: { height },
  scales: { xScale, yScale },
}: DataBarsProps<Domain>) => {
  const keys = typedKeys(data);
  console.log('data', data);
  console.log('keys', keys);
  console.log(xScale(keys[0]));
  console.log(xScale(keys[1]));
  return (
    <g>
      {keys ? (
        keys.map(k => (
          <rect
            key={k}
            x={xScale(k)}
            y={yScale(data[k])}
            height={height - margins.bottom}
            width={xScale.bandwidth ? xScale.bandwidth() : 1}
            fill="#A252B6"
          />
        ))
      ) : (
        <rect />
      )}
    </g>
  );
};
