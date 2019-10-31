import styled from 'styled-components';
import { TypedDateRange } from 'shared/util/Time';
import { TextField, IconButton } from '@material-ui/core';

export type RangeType = TypedDateRange['type'];

export interface DateRangeSelectorProps {
  dateRange?: TypedDateRange;
  onSelectRange: (range?: TypedDateRange) => void;
}

export interface SelectorProps extends DateRangeSelectorProps {
  selected: RangeType | 'none';
}

export function isValidYear(year: string | number): boolean {
  const y = Number(year);
  return (
    String(y) === String(year) && y === Math.round(y) && y > 2000 && y < 2100
  );
}

export const NumberInput = styled(TextField)`
  width: 80px;
`;

export const StyledIconButton = styled(IconButton)`
  padding: 0;
  margin: 0 4px;
`;
