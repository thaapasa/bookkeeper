import { FormLabel, Grid } from '@mui/material';
import * as React from 'react';

import { MonthPeriod, NowPeriod, YearPeriod } from 'shared/util/Period';
import { TypedDateRange } from 'shared/util/TimeRange';

import { PeriodSelector } from '../component/daterange/PeriodSelector';
import { useLocalStorage } from '../hooks/useLocalStorage';

type ChartPeriod = NowPeriod | YearPeriod | MonthPeriod;
const AllowedPeriods: ChartPeriod['type'][] = ['now', 'year', 'month'];

export const StatisticsChartRangeSelector: React.FC<{
  // TODO: Missing mapping
  onChange?: (type: TypedDateRange) => void;
}> = ({}) => {
  const [start, setStart] = useLocalStorage<ChartPeriod>(
    'statistics.chart.period.start',
    { type: 'year', year: new Date().getFullYear() - 5 }
  );
  const [end, setEnd] = useLocalStorage<ChartPeriod>(
    'statistics.chart.period.end',
    { type: 'now' }
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
