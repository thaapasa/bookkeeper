import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import * as React from 'react';

import { Category, CategoryStatistics } from 'shared/types';
import { useLocalStorage } from 'client/ui/hooks/useLocalStorage';
import { Size } from 'client/ui/Types';
import { MeasureSize } from 'client/ui/utils/MeasureSize';

import { StatisticsChartType } from '../types';
import { MonthsCategoryChart } from './MonthsChart';
import { YearlyRecurringCategoryChart } from './YearlyRecurringChart';
import { YearsCategoryChart } from './YearsChart';

interface BaseCategoryGraphProps {
  data: CategoryStatistics;
  stacked: boolean;
  categoryMap: Record<string, Category>;
  size: Size;
}

export type CategoryGraphProps = BaseCategoryGraphProps & {
  estimated: boolean;
  separateEstimate: boolean;
  stackMainCats: boolean;
};

const StatisticsGraphImpl: React.FC<
  BaseCategoryGraphProps & { type: StatisticsChartType }
> = ({ type, ...props }) => {
  const [estimated, setEstimated] = useLocalStorage(
    'statistics.chart.estimate',
    false
  );
  const [separateEstimate, setSeparateEstimate] = useLocalStorage(
    'statistics.chart.estimate.separate',
    false
  );
  const [stackMainCats, setStackMainCats] = useLocalStorage(
    'statistics.chart.estimate.stackMainCategories',
    false
  );

  return (
    <>
      <GraphSelector
        type={type}
        estimated={estimated}
        separateEstimate={separateEstimate}
        stackMainCats={stackMainCats}
        {...props}
      />
      {type === 'years' && props.stacked ? (
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={estimated}
                onChange={() => setEstimated(!estimated)}
              />
            }
            label="Sisällytä arvio"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={separateEstimate}
                onChange={() => setSeparateEstimate(!separateEstimate)}
              />
            }
            label="Arvio erillään"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={stackMainCats}
                onChange={() => setStackMainCats(!stackMainCats)}
              />
            }
            label="Alueet pääkategorioittain"
          />
        </FormGroup>
      ) : null}
    </>
  );
};

const GraphSelector: React.FC<
  CategoryGraphProps & { type: StatisticsChartType }
> = ({ type, ...props }) => {
  switch (type) {
    case 'recurring':
      return <YearlyRecurringCategoryChart {...props} />;
    case 'years':
      return <YearsCategoryChart {...props} />;
    case 'months':
      return <MonthsCategoryChart {...props} />;
    default:
      return null;
  }
};

export const CategoryStatisticsChart = MeasureSize(StatisticsGraphImpl);
