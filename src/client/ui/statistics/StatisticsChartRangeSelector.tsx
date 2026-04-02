import { Group, Stack, Text } from '@mantine/core';
import { DateTime } from 'luxon';
import * as React from 'react';

import { DateRange, MonthPeriod, NowPeriod, periodsToDateRange, YearPeriod } from 'shared/time';

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
    year: DateTime.now().year - 5,
  });
  const [end, setEnd] = useLocalStorage<ChartPeriod>('statistics.chart.period.end', {
    type: 'now',
  });
  React.useEffect(() => onChange(periodsToDateRange(start, end)), [onChange, start, end]);
  return (
    <Stack flex={1} style={{ whiteSpace: 'nowrap', minWidth: 188 }}>
      <Group>
        <Text>Aikaväli</Text>
      </Group>
      <Group>
        <PeriodSelector period={start} onSelect={setStart} allowed={['year', 'month']} />
        <PeriodSelector period={end} onSelect={setEnd} allowed={AllowedPeriods} />
      </Group>
    </Stack>
  );
};
