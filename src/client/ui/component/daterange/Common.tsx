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

export function isValidMonth(month: string | number): boolean {
  const m = Number(month);
  return (
    String(m) === String(month) && m === Math.round(m) && m >= 1 && m <= 12
  );
}

export function toMonthRange(
  year: string | number,
  month: string | number
): TypedDateRange {
  const m = toMoment(`${year}-${month}`, 'YYYY-M');
  return {
    type: 'month',
    start: m.startOf('month').toDate(),
    end: m.endOf('month').toDate(),
  };
}

export function toYearRange(year: string | number): TypedDateRange {
  const m = toMoment(year, 'YYYY');
  return {
    type: 'year',
    start: m.startOf('year').toDate(),
    end: m.endOf('year').toDate(),
  };
}

export function nextMonth(year: number, month: number): [number, number] {
  return month >= 12 ? [year + 1, 1] : [year, month + 1];
}
export function prevMonth(year: number, month: number): [number, number] {
  return month <= 1 ? [year - 1, 12] : [year, month - 1];
}

export const NumberInput = styled(TextField)`
  width: 85px;
  &.month {
    width: 75px;
  }
  margin: 0 2px;
  &:first-of-type {
    margin-left: 0;
  }
  &:last-of-type {
    margin-right: 0;
  }
`;

export const StyledIconButton = styled(IconButton)`
  padding: 0;
  margin: 0 4px;
`;
