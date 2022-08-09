import * as React from 'react';

import { CategoryStatistics } from 'shared/types/Statistics';

import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';

const StatisticsChartImpl: React.FC<{
  statistics: CategoryStatistics;
  size: Size;
}> = ({ statistics, size }) => {
  return (
    <div>
      Size is {JSON.stringify(size)}. Statistics:{' '}
      {statistics.categoryIds.join(', ')}
    </div>
  );
};

export const StatisticsChart = MeasureSize(StatisticsChartImpl);
