import styled from '@emotion/styled';
import { Checkbox } from '@mantine/core';
import * as React from 'react';

import { CategoryMap, CategoryStatistics } from 'shared/types';
import { FlexColumn } from 'client/ui/component/BasicElements';
import { useLocalStorage } from 'client/ui/hooks/useLocalStorage';
import { Size } from 'client/ui/Styles';
import { MeasureSize } from 'client/ui/utils/MeasureSize';

import { StatisticsChartType } from '../types';
import { CategoryChartRenderer } from './CategoryChartRenderer';
import { getChartConfiguration } from './ChartTypes';
import { YearlyRecurringCategoryChart } from './YearlyRecurringChart';

interface BaseCategoryGraphProps {
  data: CategoryStatistics;
  stacked: boolean;
  categoryMap: CategoryMap;
  size: Size;
}

export type CategoryGraphProps = BaseCategoryGraphProps & {
  estimated: boolean;
  separateEstimate: boolean;
  stackMainCats: boolean;
};

const StatisticsGraphImpl: React.FC<BaseCategoryGraphProps & { type: StatisticsChartType }> = ({
  type,
  ...props
}) => {
  const [estimated, setEstimated] = useLocalStorage('statistics.chart.estimate', false);
  const [separateEstimate, setSeparateEstimate] = useLocalStorage(
    'statistics.chart.estimate.separate',
    false,
  );
  const [stackMainCats, setStackMainCats] = useLocalStorage(
    'statistics.chart.estimate.stackMainCategories',
    false,
  );

  return (
    <FlexColumn>
      <GraphSelector
        type={type}
        estimated={estimated}
        separateEstimate={separateEstimate}
        stackMainCats={stackMainCats}
        {...props}
      />
      {type !== 'recurring' && props.stacked ? (
        <CheckboxRow>
          {type === 'years' ? (
            <Checkbox
              checked={estimated}
              onChange={() => setEstimated(!estimated)}
              label="Sisällytä arvio"
            />
          ) : null}
          {type === 'years' ? (
            <Checkbox
              checked={separateEstimate}
              onChange={() => setSeparateEstimate(!separateEstimate)}
              label="Arvio erillään"
            />
          ) : null}
          <Checkbox
            checked={stackMainCats}
            onChange={() => setStackMainCats(!stackMainCats)}
            label="Alueet pääkategorioittain"
          />
        </CheckboxRow>
      ) : null}
    </FlexColumn>
  );
};

const CheckboxRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex-wrap: wrap;
`;

const GraphSelector: React.FC<CategoryGraphProps & { type: StatisticsChartType }> = ({
  type,
  ...props
}) => {
  if (type === 'recurring') {
    return <YearlyRecurringCategoryChart {...props} />;
  }
  const config = getChartConfiguration(type, props);
  return config ? <CategoryChartRenderer {...config} {...props} /> : null;
};

export const CategoryStatisticsChart = MeasureSize(StatisticsGraphImpl);
