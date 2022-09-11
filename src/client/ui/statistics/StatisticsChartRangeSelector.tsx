import { FormLabel, Grid } from '@mui/material';
import * as React from 'react';

import {
  MonthPeriod,
  NowPeriod,
  periodsToDateRange,
  YearPeriod,
} from 'shared/util/Period';
import { DateRange } from 'shared/util/TimeRange';

import { PeriodSelector } from '../component/daterange/PeriodSelector';
import { useLocalStorage } from '../hooks/useLocalStorage';

type ChartPeriod = NowPeriod | YearPeriod | MonthPeriod;
const AllowedPeriods: ChartPeriod['type'][] = ['now', 'year', 'month'];

export const StatisticsChartRangeSelector: React.FC<{
  onChange: (type: DateRange) => void;
}> = ({ onChange }) => {
  const [start, setStart] = useLocalStorage<ChartPeriod>(
    'statistics.chart.period.start',
    { type: 'year', year: new Date().getFullYear() - 5 }
  );
  const [end, setEnd] = useLocalStorage<ChartPeriod>(
    'statistics.chart.period.end',
    { type: 'now' }
  );
  React.useEffect(
    () => onChange(periodsToDateRange(start, end)),
    [onChange, start, end]
  );
  return (
    <Grid container>
      <Grid item xs={4}>
        <FormLabel>Aikaväli</FormLabel>
      </Grid>
      <Grid item xs={4}>
        <PeriodSelector
          period={start}
          onSelect={setStart}
          allowed={['year', 'month']}
        />
      </Grid>
      <Grid item xs={4}>
        <PeriodSelector
          period={end}
          onSelect={setEnd}
          allowed={AllowedPeriods}
        />
      </Grid>
    </Grid>
  );
};
