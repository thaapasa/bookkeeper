import * as React from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis } from 'recharts';

import { TrackingData, TrackingStatistics } from 'shared/types';
import { formatMoney } from 'client/ui/chart/Format';

import { getChartColor } from '../chart/ChartColors';
import { Size } from '../Types';
import { MeasureSize } from '../utils/MeasureSize';

const Margins = { left: 4, top: 32, right: 4, bottom: 4 };

interface TrackingChartProps {
  data: TrackingStatistics;
  trackingData: TrackingData;
  size: Size;
}

export const TrackingChartRenderer: React.FC<TrackingChartProps> = ({
  data,
  size,
  trackingData,
}) => {
  return (
    <LineChart width={size.width} height={168} data={data.statistics} margin={Margins}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis hide dataKey="month" />
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

export const TrackingChart = MeasureSize(TrackingChartRenderer);
