import styled from 'styled-components';
import { TypedDateRange, toMoment } from 'shared/util/Time';
import { TextField, IconButton } from '@material-ui/core';

export type RangeType = TypedDateRange['type'];
export type RangeTypeOrNone = RangeType | 'none';

export interface DateRangeSelectorProps {
  dateRange?: TypedDateRange;
  onSelectRange: (range?: TypedDateRange) => void;
}

export type SelectorProps = DateRangeSelectorProps;

export function isValidYear(year: string | number): boolean {
  const y = Number(year);
  return (
    String(y) === String(year) && y === Math.round(y) && y > 2000 && y < 2100
  );
}

export function toYearRange(year: string | number): TypedDateRange {
  const m = toMoment(year, 'YYYY');
  return {
    type: 'year',
    start: m.startOf('year').toDate(),
    end: m.endOf('year').toDate(),
  };
}

export const NumberInput = styled(TextField)`
  width: 80px;
`;

export const StyledIconButton = styled(IconButton)`
  padding: 0;
  margin: 0 4px;
`;
