import * as React from 'react';

import { Icons } from 'client/ui/icons/Icons';

import { nextMonth, NumberInput, prevMonth, StyledIconButton } from './Common';

interface MonthSelectorProps {
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ year, month, onSelect }) => {
  const changeYear = React.useCallback(
    (e: React.ChangeEvent<{ value: string }>) => onSelect(Number(e.target.value), month),
    [onSelect, month],
  );
  const changeMonth = React.useCallback(
    (e: React.ChangeEvent<{ value: string }>) => onSelect(year, Number(e.target.value)),
    [onSelect, year],
  );

  return (
    <>
      <StyledIconButton onClick={() => onSelect(...prevMonth(year, month))} title="Edellinen">
        <Icons.ChevronLeft color="primary" />
      </StyledIconButton>
      <NumberInput hiddenLabel className="year" value={year} variant="filled" size="small" onChange={changeYear} />
      <NumberInput hiddenLabel className="month" value={month} variant="filled" size="small" onChange={changeMonth} />
      <StyledIconButton onClick={() => onSelect(...nextMonth(year, month))} title="Seuraava">
        <Icons.ChevronRight color="primary" />
      </StyledIconButton>
    </>
  );
};
