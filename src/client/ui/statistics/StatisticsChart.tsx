import * as React from 'react';

import { CategoryStatistics } from 'shared/types/Statistics';
import { numberRange } from 'shared/util/Arrays';
import Money from 'shared/util/Money';

import { createLabeledChart } from '../chart/LabeledChart';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';
import { StatisticsGraph } from './StatisticsGraph';

const LabeledChart = createLabeledChart(StatisticsGraph);

/*
const Months = [
  'Tammi',
  'Helmi',
  'Maalis',
  'Huhti',
  'Touko',
  'Kesä',
  'Heinä',
  'Elo',
  'Syys',
  'Loka',
  'Marras',
  'Joulu',
];
*/

const MonthDomain = numberRange(0, 11).map(i => String(i));

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
      labels={MonthDomain}
      data={statistics}
    />
  );
};

export const StatisticsChart = MeasureSize(StatisticsChartImpl);
