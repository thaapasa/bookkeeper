import * as React from 'react';

import { toMoment } from 'shared/util/Time';

import { NavigateLeft, NavigateRight } from '../../Icons';
import {
  isValidYear,
  NumberInput,
  SelectorProps,
  StyledIconButton,
  toYearRange,
} from './Common';

export function YearSelector(props: SelectorProps) {
  const { dateRange, onSelectRange } = props;
  const yearProp = toMoment(dateRange ? dateRange.start : undefined).year();
  const [year, setYear] = React.useState<string>(String(yearProp));
  React.useEffect(() => setYear(String(yearProp)), [yearProp]);
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
  const prev = React.useCallback(
    () => changeYear(Number(year) - 1),
    [year, changeYear]
  );
  const next = React.useCallback(
    () => changeYear(Number(year) + 1),
    [year, changeYear]
  );
  return (
    <>
      <StyledIconButton onClick={prev} title="Edellinen">
        <NavigateLeft color="primary" />
      </StyledIconButton>
      <NumberInput
        className="year"
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
