import styled from '@emotion/styled';
import * as React from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  Tooltip,
  XAxis,
} from 'recharts';

import { TrackingChartType, TrackingData, TrackingStatistics } from 'shared/types';
import { partition } from 'shared/util';
import { formatMoney } from 'client/ui/chart/Format';

import { getChartColor } from '../chart/ChartColors';
import { Size } from '../Types';
import { MeasureSize } from '../utils/MeasureSize';

const Margins = { left: 4, top: 4, right: 4, bottom: 4 };

interface TrackingChartProps {
  data: TrackingStatistics;
  trackingData: TrackingData;
  size: Size;
}

export const TrackingLineChartRenderer: React.FC<TrackingChartProps> = ({
  data,
  size,
  trackingData,
}) => {
  return (
    <LineChart width={size.width} height={168} data={data.statistics} margin={Margins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis hide dataKey="timeSlot" />
      <Tooltip formatter={formatMoney} />
      {data.groups.map((v, i) => (
        <Line
          type="monotone"
          key={v.key}
          dataKey={v.key}
          stroke={getChartColor(i + (trackingData.colorOffset ?? 0), 0)}
          name={v.label ?? v.key}
        />
      ))}
    </LineChart>
  );
};

export const TrackingBarChartRenderer: React.FC<TrackingChartProps> = ({
  data,
  size,
  trackingData,
}) => {
  return (
    <BarChart width={size.width} height={168} data={data.statistics} margin={Margins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis hide dataKey="timeSlot" />
      <Tooltip formatter={formatMoney} />
      {data.groups.map((v, i) => (
        <Bar
          type="monotone"
          key={v.key}
          dataKey={v.key}
          fill={getChartColor(i + (trackingData.colorOffset ?? 0), 2)}
          name={v.label ?? v.key}
        />
      ))}
    </BarChart>
  );
};

export const TrackingCombinedRenderer: React.FC<TrackingChartProps> = ({
  data,
  size,
  trackingData,
}) => {
  const [lines, bars] = partition(g => g.chartType === 'line', data.groups);
  return (
    <ComposedChart width={size.width} height={168} data={data.statistics} margin={Margins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis hide dataKey="timeSlot" />
      <Tooltip formatter={formatMoney} />
      {lines.map((v, i) => (
        <Area
          type="monotone"
          key={v.key}
          dataKey={v.key}
          fill={getChartColor(i + (trackingData.colorOffset ?? 0), 6)}
          stroke={getChartColor(i + (trackingData.colorOffset ?? 0), 2)}
          name={v.label ?? v.key}
        />
      ))}
      {bars.map((v, i) => (
        <Bar
          type="monotone"
          key={v.key}
          dataKey={v.key}
          fill={getChartColor(i + (trackingData.colorOffset ?? 0) + lines.length, 1)}
          name={v.label ?? v.key}
        />
      ))}
    </ComposedChart>
  );
};

const ChartTypeRenderers: Record<TrackingChartType, React.FC<TrackingChartProps>> = {
  bar: TrackingBarChartRenderer,
  line: TrackingLineChartRenderer,
  combined: TrackingCombinedRenderer,
};

export const TrackingChartRenderer: React.FC<TrackingChartProps> = props => {
  const Renderer =
    ChartTypeRenderers[props.trackingData.chartType ?? 'line'] ?? TrackingBarChartRenderer;
  return (
    <ChartContainer>
      <Renderer {...props} />
    </ChartContainer>
  );
};

const ChartContainer = styled('div')`
  position: absolute;
`;

export const TrackingChart = MeasureSize(TrackingChartRenderer, 168);
