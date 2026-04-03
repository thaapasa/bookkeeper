import { Group } from '@mantine/core';
import * as React from 'react';

import { Icons } from 'client/ui/icons/Icons';

import { CompactInputText, StyledIconButton } from './Common';

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
    <Group gap={0} w="fit-content">
      <StyledIconButton onClick={() => onSelect(year - 1)} title="Edellinen">
        <Icons.ChevronLeft color="primary" />
      </StyledIconButton>
      <CompactInputText type="number" value={String(year)} onChange={changeYear} w={50} />
      <StyledIconButton onClick={() => onSelect(year + 1)} title="Seuraava">
        <Icons.ChevronRight color="primary" />
      </StyledIconButton>
    </Group>
  );
};
