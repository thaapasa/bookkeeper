import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import * as React from 'react';

import { ISOMonth } from 'shared/time';
import { Category, CategoryStatistics } from 'shared/types';
import { useLocalStorage } from 'client/ui/hooks/useLocalStorage';
import { Size } from 'client/ui/Types';
import { MeasureSize } from 'client/ui/utils/MeasureSize';

import { StatisticsChartType } from '../types';
import { CategoryChartRenderer } from './CategoryChartRenderer';
import { categoryStatisticsToMonthlyData } from './MonthsChartData';
import { categoryStatisticsToQuartersData } from './QuartersChartData';
import { YearlyRecurringCategoryChart } from './YearlyRecurringChart';
import { categoryStatisticsToYearlyData } from './YearsChartData';

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
      {(type === 'years' || type === 'months') && props.stacked ? (
        <FormGroup row>
          {type === 'years' ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={estimated}
                  onChange={() => setEstimated(!estimated)}
                />
              }
              label="Sisällytä arvio"
            />
          ) : null}
          {type === 'years' ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={separateEstimate}
                  onChange={() => setSeparateEstimate(!separateEstimate)}
                />
              }
              label="Arvio erillään"
            />
          ) : null}
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
      const lastYear = props.data.range.endDate.substring(0, 4);
      return (
        <CategoryChartRenderer
          convertData={categoryStatisticsToYearlyData}
          dataKey="year"
          tickFormatter={year =>
            props.estimated && !props.separateEstimate && year === lastYear
              ? `${year} (arvio)`
              : year
          }
          {...props}
        />
      );
    case 'months':
      return (
        <CategoryChartRenderer
          convertData={categoryStatisticsToMonthlyData}
          dataKey="month"
          tickFormatter={formatMonth}
          labelFormatter={formatMonth}
          {...props}
        />
      );
    case 'quarters':
      return (
        <CategoryChartRenderer
          convertData={categoryStatisticsToQuartersData}
          dataKey="quarter"
          {...props}
        />
      );
    default:
      return null;
  }
};

function formatMonth(m: ISOMonth) {
  return m.replace('-', '/');
}

export const CategoryStatisticsChart = MeasureSize(StatisticsGraphImpl);
