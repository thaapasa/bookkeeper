import * as React from 'react';

import { NavigateLeft, NavigateRight } from '../../Icons';
import { nextMonth, NumberInput, prevMonth, StyledIconButton } from './Common';

interface MonthSelectorProps {
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  year,
  month,
  onSelect,
}) => {
  const changeYear = React.useCallback(
    (e: React.ChangeEvent<{ value: string }>) =>
      onSelect(Number(e.target.value), month),
    [onSelect, month]
  );
  const changeMonth = React.useCallback(
    (e: React.ChangeEvent<{ value: string }>) =>
      onSelect(year, Number(e.target.value)),
    [onSelect, year]
  );

  return (
    <>
      <StyledIconButton
        onClick={() => onSelect(...prevMonth(year, month))}
        title="Edellinen"
      >
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
      <NumberInput
        className="month"
        value={month}
        label="Kuukausi"
        variant="filled"
        InputLabelProps={{ shrink: true }}
        onChange={changeMonth}
      />
      <StyledIconButton
        onClick={() => onSelect(...nextMonth(year, month))}
        title="Seuraava"
      >
        <NavigateRight color="primary" />
      </StyledIconButton>
    </>
  );
};
