import * as React from 'react';
import { TypedDateRange, toMoment } from 'shared/util/Time';
import { NavigateLeft, NavigateRight } from '../../Icons';
import {
  SelectorProps,
  isValidYear,
  StyledIconButton,
  NumberInput,
} from './Common';

function toYearRange(year: string | number): TypedDateRange {
  const m = toMoment(year, 'YYYY');
  return {
    type: 'year',
    start: m.startOf('year').toDate(),
    end: m.endOf('year').toDate(),
  };
}

export function YearSelector(props: SelectorProps) {
  const { dateRange, selected, onSelectRange } = props;
  const yearP = toMoment(dateRange ? dateRange.start : undefined).year();
  const [year, setYear] = React.useState<string>(String(yearP));
  React.useEffect(() => setYear(String(yearP)), [yearP]);
  React.useEffect(
    () => (selected === 'year' ? onSelectRange(toYearRange(yearP)) : undefined),
    [selected, onSelectRange, yearP]
  );
  const changeYear = React.useCallback(
    (e: number | React.ChangeEvent<{ value: string }>) => {
      const newYear = typeof e === 'object' ? e.target.value : e;
      setYear(String(newYear));
      if (isValidYear(newYear)) {
        onSelectRange(toYearRange(newYear));
      }
    },
    [setYear, onSelectRange]
  );
  const prev = React.useCallback(() => changeYear(Number(year) - 1), [
    year,
    changeYear,
  ]);
  const next = React.useCallback(() => changeYear(Number(year) + 1), [
    year,
    changeYear,
  ]);
  console.log('Render year selector for', yearP, year, selected);
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
      <StyledIconButton onClick={next} title="Seuraava">
        <NavigateRight color="primary" />
      </StyledIconButton>
    </>
  );
}
