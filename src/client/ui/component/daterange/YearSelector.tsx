import * as React from 'react';

import { Icons } from 'client/ui/icons/Icons';

import { NumberInput, StyledIconButton } from './Common';

interface YearSelectorProps {
  year: number;
  onSelect: (year: number) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({ year, onSelect }) => {
  const changeYear = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onSelect(Number(e.target.value)),
    [onSelect],
  );

  return (
    <>
      <StyledIconButton onClick={() => onSelect(year - 1)} title="Edellinen">
        <Icons.ChevronLeft color="primary" />
      </StyledIconButton>
      <NumberInput
        className="year"
        value={String(year)}
        onChange={changeYear}
      />
      <StyledIconButton onClick={() => onSelect(year + 1)} title="Seuraava">
        <Icons.ChevronRight color="primary" />
      </StyledIconButton>
    </>
  );
};
