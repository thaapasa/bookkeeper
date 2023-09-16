import { FormLabel, styled } from '@mui/material';
import dayjs from 'dayjs';
import * as React from 'react';

import { DateRange, MonthPeriod, NowPeriod, periodsToDateRange, YearPeriod } from 'shared/time';

import { FlexColumn, FlexRow } from '../component/BasicElements';
import { PeriodSelector } from '../component/daterange/PeriodSelector';
import { useLocalStorage } from '../hooks/useLocalStorage';

type ChartPeriod = NowPeriod | YearPeriod | MonthPeriod;
const AllowedPeriods: ChartPeriod['type'][] = ['now', 'year', 'month'];

export const StatisticsChartRangeSelector: React.FC<{
  /** Selected range is inclusive on both ends */
  onChange: (type: DateRange) => void;
}> = ({ onChange }) => {
  const [start, setStart] = useLocalStorage<ChartPeriod>('statistics.chart.period.start', {
    type: 'year',
    year: dayjs().year() - 5,
  });
  const [end, setEnd] = useLocalStorage<ChartPeriod>('statistics.chart.period.end', {
    type: 'now',
  });
  React.useEffect(() => onChange(periodsToDateRange(start, end)), [onChange, start, end]);
  return (
    <Container>
      <FlexRow>
        <FormLabel>Aikaväli</FormLabel>
      </FlexRow>
      <FlexRow>
        <PeriodSelector period={start} onSelect={setStart} allowed={['year', 'month']} />
        <PeriodSelector period={end} onSelect={setEnd} allowed={AllowedPeriods} />
      </FlexRow>
    </Container>
  );
};

const Container = styled(FlexColumn)`
  flex: 1;
  justify-content: space-around;
`;
