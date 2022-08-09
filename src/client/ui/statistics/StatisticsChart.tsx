import * as React from 'react';

import { CategoryStatistics } from 'shared/types/Statistics';

import { useElementSize } from '../utils/useElementSize';

export const StatisticsChart: React.FC<{ statistics: CategoryStatistics }> = ({
  statistics,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const size = useElementSize(containerRef);

  return (
    <div ref={containerRef}>
      Size is {JSON.stringify(size)}. Statistics:{' '}
      {statistics.categoryIds.join(', ')}
    </div>
  );
};
