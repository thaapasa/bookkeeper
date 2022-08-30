import { AxisDomain, AxisScale } from 'd3-axis';
import { scaleBand, scaleLinear, scalePoint } from 'd3-scale';
import * as React from 'react';

import { Size } from '../utils/useElementSize';
import { useObjectMemo } from '../utils/useObjectMemo';
import { usePersistentMemo } from '../utils/usePersistentMemo';
import { Axes } from './Axes';
import { CommonChartProps } from './types';

type ScaleType = 'band' | 'point';

interface LabeledChartProps {
  size: Size;
  maxValue?: number;
  minValue?: number;
  labels: string[];
  labelFormatter?: (domain: string) => string;
}

const ChartMargins = { top: 50, right: 20, bottom: 80, left: 60 };

function createXScale<Domain extends AxisDomain>(
  type: ScaleType,
  domain: Domain[],
  chartWidth: number
): AxisScale<Domain> {
  const range = [ChartMargins.left, chartWidth - ChartMargins.right];
  if (type === 'band') {
    return scaleBand<Domain>(domain, range).padding(0.5);
  } else if (type === 'point') {
    return scalePoint(domain, range);
  } else {
    throw new Error(`Invalid scale type ${type}`);
  }
}

export function createLabeledChart<P extends CommonChartProps<any>>(
  graphRenderer: React.ComponentType<P>,
  scaleType: ScaleType
) {
  const LabeledChartView: React.FC<
    LabeledChartProps & Omit<P, keyof CommonChartProps<any>>
  > = ({ size, maxValue, minValue, labels, labelFormatter, ...rest }) => {
    const containerWidth = size.width;

    const margins = ChartMargins;
    const width = Math.min(
      maxValue !== undefined && labels.length > 0 ? labels.length * 90 : 10000,
      containerWidth
    );
    const svgDimensions = React.useMemo(
      () => ({ width: Math.max(width, 300), height: 500 }),
      [width]
    );

    const xScale = usePersistentMemo(
      () => createXScale(scaleType, labels, svgDimensions.width),
      [(svgDimensions.width, maxValue)]
    );
    const yScale = usePersistentMemo(
      () =>
        scaleLinear<number>()
          .domain([minValue ?? 0, maxValue ?? 0])
          .range([svgDimensions.height - margins.bottom, margins.top]),
      [minValue, maxValue, svgDimensions.height]
    );

    const scales = useObjectMemo({ xScale, yScale });

    const GraphRenderer = graphRenderer as any;
    return (
      <svg width={svgDimensions.width} height={svgDimensions.height}>
        <Axes
          scales={scales}
          margins={margins}
          svgDimensions={svgDimensions}
          labelFormatter={labelFormatter}
        />
        {GraphRenderer ? (
          <GraphRenderer
            scales={scales}
            margins={margins}
            svgDimensions={svgDimensions}
            maxValue={maxValue ?? 0}
            {...rest}
          />
        ) : null}
      </svg>
    );
  };
  return LabeledChartView;
}
