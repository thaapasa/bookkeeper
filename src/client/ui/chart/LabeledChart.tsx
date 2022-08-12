import { scaleBand, scaleLinear } from 'd3-scale';
import * as React from 'react';

import { Size } from '../utils/useElementSize';
import { usePersistentMemo } from '../utils/usePersistentMemo';
import { Axes } from './Axes';
import { CommonChartProps } from './types';

interface LabeledChartProps {
  size: Size;
  maxValue?: number;
  minValue?: number;
  labels: string[];
}

const ChartMargins = { top: 50, right: 20, bottom: 80, left: 60 };

export function createLabeledChart<P extends CommonChartProps>(
  graphRenderer?: React.ComponentType<P>
) {
  const LabeledChartView: React.FC<
    LabeledChartProps & Omit<P, keyof CommonChartProps>
  > = ({ size, maxValue, minValue, labels, ...rest }) => {
    const xScaleP = usePersistentMemo(() => scaleBand<string>(), []);
    const yScaleP = usePersistentMemo(() => scaleLinear<number>(), []);

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

    const xScale =
      maxValue !== undefined && labels.length > 0
        ? xScaleP
            .padding(0.5)
            .domain(labels)
            .range([margins.left, svgDimensions.width - margins.right])
        : xScaleP;

    const yScale = yScaleP
      // scaleLinear domain required at least two values, min and max
      .domain([minValue ?? 0, maxValue ?? 0])
      .range([svgDimensions.height - margins.bottom, margins.top]);

    const scales = { xScale, yScale };

    const GraphRenderer = graphRenderer as any;
    return (
      <svg width={svgDimensions.width} height={svgDimensions.height}>
        <Axes scales={scales} margins={margins} svgDimensions={svgDimensions} />
        {GraphRenderer ? (
          <GraphRenderer
            scales={scales}
            margins={margins}
            svgDimensions={svgDimensions}
            {...rest}
          />
        ) : null}
      </svg>
    );
  };
  return LabeledChartView;
}
