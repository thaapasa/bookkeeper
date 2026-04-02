import { Button, Stack } from '@mantine/core';
import * as React from 'react';

import { AllPeriods, Period, periodToYearAndMonth, PeriodType } from 'shared/time';

import { MonthSelector } from './MonthSelector';
import styles from './PeriodSelector.module.css';
import { YearSelector } from './YearSelector';

export interface PeriodSelectorProps<P extends Period> {
  period: P;
  onSelect: (period: P) => void;
  allowed?: P['type'][];
}

export const PeriodSelector: React.FC<PeriodSelectorProps<any>> = <P extends Period>({
  period,
  onSelect,
  allowed,
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
    <div className={styles.container}>
      <Stack gap={0}>
        <div>
          {validPeriods.map(v => (
            <Button
              key={v}
              variant="subtle"
              onClick={() => changeType(v)}
              className={type === v ? styles.tabButtonSelected : undefined}
              style={{ padding: '4px 6px' }}
            >
              {PeriodTitles[v]}
            </Button>
          ))}
        </div>
      </Stack>
      {type === 'year' ? (
        <div className={styles.panel}>
          <YearSelector year={year} onSelect={setYear} />
        </div>
      ) : null}
      {type === 'month' ? (
        <div className={styles.panel}>
          <MonthSelector year={year} month={month} onSelect={setYearMonth} />
        </div>
      ) : null}
    </div>
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
