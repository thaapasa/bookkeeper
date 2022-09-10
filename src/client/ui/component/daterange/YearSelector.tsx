import * as React from 'react';

import { NavigateLeft, NavigateRight } from 'client/ui/Icons';

import { NumberInput, StyledIconButton } from './Common';

interface YearSelectorProps {
  year: number;
  onSelect: (year: number) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  year,
  onSelect,
}) => {
  const changeYear = React.useCallback(
    (e: React.ChangeEvent<{ value: string }>) =>
      onSelect(Number(e.target.value)),
    [onSelect]
  );

  return (
    <>
      <StyledIconButton onClick={() => onSelect(year - 1)} title="Edellinen">
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
      <StyledIconButton onClick={() => onSelect(year + 1)} title="Seuraava">
        <NavigateRight color="primary" />
      </StyledIconButton>
    </>
  );
};
