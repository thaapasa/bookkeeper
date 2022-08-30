import * as React from 'react';

import { CategoryStatistics } from 'shared/types/Statistics';
import { numberRange } from 'shared/util/Arrays';
import Money from 'shared/util/Money';

import { createLabeledChart } from '../chart/LabeledChart';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';
import { StatisticsGraph } from './StatisticsGraph';
import { Months } from './types';

const LabeledChart = createLabeledChart(StatisticsGraph, 'point');

/**
 * Statistics chart data:
 *
 * XDomain = month number as string (1=Jan, 2=Feb, etc.)
 * YDomain = number (euros)
 */

const months = numberRange(1, 12).map(i => String(i));

const StatisticsChartImpl: React.FC<{
  statistics: CategoryStatistics;
  size: Size;
}> = ({ statistics, size }) => {
  const maxValue = Object.values(statistics.statistics)
    .flat()
    .reduce((p, c) => (p.gt(c.sum) ? p : new Money(c.sum)), new Money(0));

  return (
    <LabeledChart
      size={size}
      maxValue={maxValue.valueOf()}
      domain={months}
      data={statistics}
      labelFormatter={m => Months[Number(m) - 1]}
    />
  );
};

export const StatisticsChart = MeasureSize(StatisticsChartImpl);
