import * as React from 'react';

import { CategoryStatistics } from 'shared/types/Statistics';

import { createLabeledChart } from '../chart/LabeledChart';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';

const LabeledChart = createLabeledChart();

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

const StatisticsChartImpl: React.FC<{
  statistics: CategoryStatistics;
  size: Size;
}> = ({ size }) => {
  return <LabeledChart size={size} maxValue={10000} labels={Months} />;
};

export const StatisticsChart = MeasureSize(StatisticsChartImpl);
