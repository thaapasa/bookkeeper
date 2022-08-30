import * as d3Axis from 'd3-axis';
import { select as d3Select } from 'd3-selection';
import * as React from 'react';
import styled from 'styled-components';

import { media } from '../Styles';
import { ChartMargins, ChartOrient, ChartScales } from './types';

interface AxesProps<XDomain> {
  scales: ChartScales<XDomain>;
  margins: ChartMargins;
  svgDimensions: { height: number; width: number };
  labelFormatter?: (label: string) => string;
}

export const Axes: React.FC<AxesProps<string>> = ({
  scales,
  margins,
  svgDimensions: { height, width },
  labelFormatter,
}) => (
  <g>
    <Axis
      orient="Bottom"
      scale={scales.xScale}
      translate={`translate(0, ${height - margins.bottom})`}
      tickSize={width - margins.left - margins.right}
      labelFormatter={labelFormatter}
    />
    <Axis
      orient="Left"
      scale={scales.yScale}
      translate={`translate(${margins.left}, 0)`}
      tickSize={width - margins.left - margins.right}
    />
  </g>
);

interface AxisProps<D extends d3Axis.AxisDomain> {
  orient: ChartOrient;
  scale: d3Axis.AxisScale<D>;
  tickSize: number;
  translate: string;
  labelFormatter?: (label: string) => string;
}

const Axis: React.FC<AxisProps<any>> = ({
  orient,
  scale,
  tickSize,
  translate,
  labelFormatter,
}) => {
  const axisRef = React.useRef<SVGGElement>(null);

  // Render the axis whenever it changes.
  // Must be updated on each render as the scales objects will be the same
  // (even though the range may change) - thus no deps array
  React.useEffect(() => {
    let axis = getAxis(orient, scale)
      .tickSize(-tickSize)
      .tickPadding(12)
      .ticks([6]);
    if (labelFormatter) {
      axis = axis.tickFormat(labelFormatter);
    }

    if (axisRef.current) {
      d3Select(axisRef.current).call(axis);
    }
  });

  return (
    <AxisG
      className={`Axis Axis-${orient}`}
      ref={axisRef}
      transform={translate}
    />
  );
};

function getAxis<D extends d3Axis.AxisDomain>(
  orient: ChartOrient,
  scale: d3Axis.AxisScale<D>
): d3Axis.Axis<D> {
  switch (orient) {
    case 'Bottom':
      return d3Axis.axisBottom(scale);
    case 'Top':
      return d3Axis.axisTop(scale);
    case 'Left':
      return d3Axis.axisLeft(scale);
    case 'Right':
      return d3Axis.axisRight(scale);
    default:
      throw new Error('Invalid orient:' + orient);
  }
}

const AxisG = styled.g`
  .domain {
    display: none;
  }
  line {
    stroke: #e0e0e0;
  }
  &.Axis-Bottom .tick line {
    display: none;
  }
  ${media.mobile`
    &.Axis-Bottom text {
      transform: rotate(-45deg);
      text-anchor: end;
    }
  `}
`;
