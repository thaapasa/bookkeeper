import { Button, Stack, StackProps } from '@mantine/core';
import * as React from 'react';

import { AllPeriods, Period, periodToYearAndMonth, PeriodType } from 'shared/time';

import { MonthSelector } from './MonthSelector';
import { YearSelector } from './YearSelector';

export type PeriodSelectorProps<P extends Period> = {
  period: P;
  onSelect: (period: P) => void;
  allowed?: P['type'][];
} & Omit<StackProps, 'onSelect'>;

export const PeriodSelector: React.FC<PeriodSelectorProps<any>> = <P extends Period>({
  period,
  onSelect,
  allowed,
  ...props
}: PeriodSelectorProps<P>) => {
  const validPeriods: P['type'][] = allowed ?? AllPeriods;

  const [initialYear, initialMonth] = periodToYearAndMonth(period);
  const [year, setYear] = React.useState(initialYear);
  const [month, setMonth] = React.useState(initialMonth);
  const [type, changeType] = React.useState<PeriodType>(period.type);

  const setYearMonth = React.useCallback(
    (year: number, month: number) => {
      setYear(year);
      setMonth(month);
    },
    [setYear, setMonth],
  );

  React.useEffect(
    () => onSelect(valuesToPeriod<P>(type, year, month)),
    [onSelect, type, year, month],
  );

  return (
    <Stack gap="xs" w="fit-content" {...props}>
      <Button.Group>
        {validPeriods.map(v => (
          <Button
            size="compact-sm"
            key={v}
            onClick={() => changeType(v)}
            variant={type === v ? 'primary' : 'default'}
          >
            {PeriodTitles[v]}
          </Button>
        ))}
      </Button.Group>
      {type === 'year' ? <YearSelector year={year} onSelect={setYear} /> : null}
      {type === 'month' ? (
        <MonthSelector year={year} month={month} onSelect={setYearMonth} />
      ) : null}
    </Stack>
  );
};

function valuesToPeriod<P extends Period>(type: P['type'], year: number, month: number): P {
  switch (type) {
    case 'month':
      return { type, year, month } as P;
    case 'year':
      return { type, year } as P;
    default:
      return { type } as P;
  }
}

const PeriodTitles: Record<PeriodType, string> = {
  all: 'Kaikki',
  now: 'Nyt',
  year: 'Vuosi',
  month: 'Kuu',
};
