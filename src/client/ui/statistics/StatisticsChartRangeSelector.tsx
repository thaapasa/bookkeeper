import { FormLabel } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import {
  DateRange,
  MonthPeriod,
  NowPeriod,
  periodsToDateRange,
  YearPeriod,
} from 'shared/time';

import { Column, Row } from '../component/BasicElements';
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
    <Container>
      <Row>
        <FormLabel>Aikaväli</FormLabel>
      </Row>
      <Row>
        <PeriodSelector
          period={start}
          onSelect={setStart}
          allowed={['year', 'month']}
        />
        <PeriodSelector
          period={end}
          onSelect={setEnd}
          allowed={AllowedPeriods}
        />
      </Row>
    </Container>
  );
};

const Container = styled(Column)`
  flex: 1;
  justify-content: space-around;
`;
