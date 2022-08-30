import * as React from 'react';

import Money from 'shared/util/Money';

import { createLabeledChart } from '../chart/LabeledChart';
import { MeasureSize } from '../utils/MeasureSize';
import { Size } from '../utils/useElementSize';
import { CategoryBars } from './CategoryBars';

export interface CategoryChartData {
  categoryId: number;
  categoryName: string;
  categoryTotal: number;
}

interface CategoryChartProps {
  chartData: CategoryChartData[] | undefined;
  size: Size;
}

const LabeledChart = createLabeledChart(CategoryBars, 'band');

const CategoryChartImpl: React.FC<CategoryChartProps> = ({
  chartData,
  size,
}) => {
  const maxValue = chartData
    ? Math.max(...chartData.map(d => Money.toValue(d.categoryTotal)))
    : 0;
  const labels = React.useMemo(
    () => chartData?.map(d => d.categoryName) ?? [],
    [chartData]
  );

  return (
    <LabeledChart
      size={size}
      maxValue={maxValue}
      labels={labels}
      data={chartData}
    />
  );
};

export const CategoryChart = MeasureSize(CategoryChartImpl);
