import * as React from 'react';

import { CategoryStatistics } from 'shared/types/Statistics';
import { numberRange } from 'shared/util/Arrays';
import Money from 'shared/util/Money';

import { createLabeledChart } from '../chart/LabeledChart';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';
import { StatisticsBarGraph, StatisticsLineGraph } from './StatisticsGraph';
import { Months } from './types';

const LabeledLineChart = createLabeledChart(StatisticsLineGraph, 'point');
const LabeledBarChart = createLabeledChart(StatisticsBarGraph, 'band');

const useLines = false;

/**
 * Statistics chart data:
 *
 * XDomain = month number (1=Jan, 2=Feb, etc.)
 * YDomain = number (euros)
 */

const months = numberRange(1, 12);

const StatisticsChartImpl: React.FC<{
  statistics: CategoryStatistics;
  size: Size;
}> = ({ statistics, size }) => {
  const maxValue = Object.values(statistics.statistics)
    .flat()
    .reduce((p, c) => (p.gt(c.sum) ? p : new Money(c.sum)), new Money(0));

  const Chart = useLines ? LabeledLineChart : LabeledBarChart;
  return (
    <Chart
      size={size}
      maxValue={maxValue.valueOf()}
      domain={months}
      data={statistics}
      labelFormatter={m => Months[m - 1]}
    />
  );
};

export const StatisticsChart = MeasureSize(StatisticsChartImpl);
