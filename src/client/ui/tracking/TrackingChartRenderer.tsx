import * as React from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis } from 'recharts';

import { TrackingStatistics } from 'shared/types';
import { logger } from 'client/Logger';
import { formatMoney } from 'client/ui/chart/Format';

import { Size } from '../Types';
import { MeasureSize } from '../utils/MeasureSize';

const Margins = { left: 4, top: 32, right: 4, bottom: 4 };

interface TrackingChartProps {
  data: TrackingStatistics;
  size: Size;
}

export const TrackingChartRenderer: React.FC<TrackingChartProps> = ({ data, size }) => {
  logger.info({ stats: data.statistics }, `tracking data`);
  return (
    <LineChart width={size.width} height={168} data={data.statistics} margin={Margins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis hide dataKey="month" />
      <Tooltip formatter={formatMoney} />
      {data.groups.map(v => (
        <Line type="monotone" key={v.key} dataKey={v.key} stroke="blue" name={v.label ?? v.key} />
      ))}
    </LineChart>
  );
};

export const TrackingChart = MeasureSize(TrackingChartRenderer);
