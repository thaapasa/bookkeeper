import { Box } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import * as React from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  XAxis,
} from 'recharts';

import { TrackingChartType, TrackingData, TrackingStatistics } from 'shared/types';
import { partition } from 'shared/util';
import { ChartTooltip } from 'client/ui/chart/ChartTooltip';

import { getChartColor } from '../chart/ChartColors';

const Margins = { left: 4, top: 4, right: 4, bottom: 4 };

export const CHART_HEIGHT = 168;

interface TrackingChartProps {
  data: TrackingStatistics;
  trackingData: TrackingData;
  size: { width: number; height: number };
  growTooltipUp?: boolean;
}

export const TrackingLineChartRenderer: React.FC<TrackingChartProps> = ({
  data,
  size,
  trackingData,
  growTooltipUp,
}) => {
  return (
    <LineChart width={size.width} height={CHART_HEIGHT} data={data.statistics} margin={Margins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis hide dataKey="timeSlot" />
      <ChartTooltip anchor={growTooltipUp ? 'bottom' : 'top'} />
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
  growTooltipUp,
}) => {
  return (
    <BarChart width={size.width} height={CHART_HEIGHT} data={data.statistics} margin={Margins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis hide dataKey="timeSlot" />
      <ChartTooltip anchor={growTooltipUp ? 'bottom' : 'top'} />
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
  growTooltipUp,
}) => {
  const [lines, bars] = partition(g => g.chartType === 'line', data.groups);
  return (
    <ComposedChart width={size.width} height={CHART_HEIGHT} data={data.statistics} margin={Margins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis hide dataKey="timeSlot" />
      <ChartTooltip anchor={growTooltipUp ? 'bottom' : 'top'} />
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

const TrackingChartRenderer: React.FC<TrackingChartProps> = props => {
  const Renderer =
    ChartTypeRenderers[props.trackingData.chartType ?? 'line'] ?? TrackingBarChartRenderer;
  return (
    <Box pos="absolute">
      <Renderer {...props} />
    </Box>
  );
};

export const TrackingChart: React.FC<Omit<TrackingChartProps, 'size'>> = props => {
  const { ref, width } = useElementSize();
  return (
    <Box ref={ref} display="flex" flex={1} h={CHART_HEIGHT} style={{ minWidth: 0 }}>
      {width > 0 ? (
        <TrackingChartRenderer size={{ width, height: CHART_HEIGHT }} {...props} />
      ) : null}
    </Box>
  );
};
