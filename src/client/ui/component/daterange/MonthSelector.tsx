import * as React from 'react';
import { toMoment } from 'shared/util/Time';
import { NavigateLeft, NavigateRight } from '../../Icons';
import {
  SelectorProps,
  isValidYear,
  StyledIconButton,
  NumberInput,
  isValidMonth,
  toMonthRange,
  prevMonth,
  nextMonth,
} from './Common';

export function MonthSelector(props: SelectorProps) {
  const { dateRange, onSelectRange } = props;
  const startProp = toMoment(dateRange ? dateRange.start : undefined);
  const yearProp = startProp.year();
  const monthProp = startProp.month() + 1;
  const [year, setYear] = React.useState<string>(String(yearProp));
  const [month, setMonth] = React.useState<string>(String(monthProp));
  React.useEffect(() => setYear(String(yearProp)), [yearProp]);
  React.useEffect(() => setMonth(String(monthProp)), [monthProp]);
  const changeYear = React.useCallback(
    (e: number | React.ChangeEvent<{ value: string }>) => {
      const newYear = typeof e === 'object' ? e.target.value : e;
      setYear(String(newYear));
      if (isValidYear(newYear) && isValidMonth(month)) {
        onSelectRange(toMonthRange(newYear, month));
      }
    },
    [setYear, onSelectRange, month]
  );
  const changeMonth = React.useCallback(
    (e: number | React.ChangeEvent<{ value: string }>) => {
      const newMonth = typeof e === 'object' ? e.target.value : e;
      setMonth(String(newMonth));
      if (isValidYear(year) && isValidMonth(newMonth)) {
        onSelectRange(toMonthRange(year, newMonth));
      }
    },
    [setMonth, onSelectRange, year]
  );
  const prev = React.useCallback(() => {
    const [y, m] = prevMonth(Number(year), Number(month));
    setYear(String(y));
    setMonth(String(m));
    if (isValidYear(y) && isValidMonth(m)) {
      onSelectRange(toMonthRange(y, m));
    }
  }, [year, month, onSelectRange]);
  const next = React.useCallback(() => {
    const [y, m] = nextMonth(Number(year), Number(month));
    setYear(String(y));
    setMonth(String(m));
    if (isValidYear(y) && isValidMonth(m)) {
      onSelectRange(toMonthRange(y, m));
    }
  }, [year, month, onSelectRange]);
  return (
    <>
      <StyledIconButton onClick={prev} title="Edellinen">
        <NavigateLeft color="primary" />
      </StyledIconButton>
      <NumberInput
        value={year}
        label="Vuosi"
        variant="filled"
        InputLabelProps={{ shrink: true }}
        onChange={changeYear}
      />
      <NumberInput
        value={month}
        label="Kuukausi"
        variant="filled"
        InputLabelProps={{ shrink: true }}
        onChange={changeMonth}
      />
      <StyledIconButton onClick={next} title="Seuraava">
        <NavigateRight color="primary" />
      </StyledIconButton>
    </>
  );
}
