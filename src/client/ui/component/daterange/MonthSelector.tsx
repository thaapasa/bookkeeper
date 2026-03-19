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
    (e: React.ChangeEvent<HTMLInputElement>) => onSelect(Number(e.target.value), month),
    [onSelect, month],
  );
  const changeMonth = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onSelect(year, Number(e.target.value)),
    [onSelect, year],
  );

  return (
    <>
      <StyledIconButton onClick={() => onSelect(...prevMonth(year, month))} title="Edellinen">
        <Icons.ChevronLeft color="primary" />
      </StyledIconButton>
      <NumberInput
        className="year"
        value={String(year)}
        onChange={changeYear}
      />
      <NumberInput
        className="month"
        value={String(month)}
        onChange={changeMonth}
      />
      <StyledIconButton onClick={() => onSelect(...nextMonth(year, month))} title="Seuraava">
        <Icons.ChevronRight color="primary" />
      </StyledIconButton>
    </>
  );
};
