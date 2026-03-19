import styled from '@emotion/styled';
import { ActionIcon, type ActionIconProps } from '@mantine/core';
import React from 'react';

import { dayJsForDate, ISOMonth, toDateTime, TypedDateRange } from 'shared/time';

export type RangeType = TypedDateRange['type'];
export type RangeTypeOrNone = RangeType | 'none';

export interface DateRangeSelectorProps {
  dateRange?: TypedDateRange;
  onSelectRange: (range?: TypedDateRange) => void;
}

export type SelectorProps = DateRangeSelectorProps;

export function isValidYear(year: string | number): boolean {
  const y = Number(year);
  return String(y) === String(year) && y === Math.round(y) && y > 2000 && y < 2100;
}

export function isValidMonth(month: string | number): boolean {
  const m = Number(month);
  return String(m) === String(month) && m === Math.round(m) && m >= 1 && m <= 12;
}

export function toMonthRange(year: string | number, month: string | number): TypedDateRange {
  const m = dayJsForDate(year, month, 1);
  return {
    type: 'month',
    start: m.startOf('month').toJSDate(),
    end: m.endOf('month').toJSDate(),
  };
}

export function parseMonthRange(monthInput: ISOMonth): TypedDateRange {
  const m = toDateTime(monthInput + '-01');
  return {
    type: 'month',
    start: m.startOf('month').toJSDate(),
    end: m.endOf('month').toJSDate(),
  };
}

export function toYearRange(year: string | number): TypedDateRange {
  const m = dayJsForDate(year, 1, 1);
  return {
    type: 'year',
    start: m.startOf('year').toJSDate(),
    end: m.endOf('year').toJSDate(),
  };
}

export function nextMonth(year: number, month: number): [number, number] {
  return month >= 12 ? [year + 1, 1] : [year, month + 1];
}
export function prevMonth(year: number, month: number): [number, number] {
  return month <= 1 ? [year - 1, 12] : [year, month - 1];
}

export const NumberInput = styled.input`
  width: 64px;
  &.month {
    width: 42px;
  }
  margin: 0 2px;
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  font-size: inherit;
  text-align: center;
  &:first-of-type {
    margin-left: 0;
  }
  &:last-of-type {
    margin-right: 0;
  }
`;

export const StyledIconButton: React.FC<
  ActionIconProps & React.ButtonHTMLAttributes<HTMLButtonElement> & React.PropsWithChildren
> = ({ children, ...props }) => (
  <ActionIcon variant="subtle" {...props} style={{ padding: 0, margin: '0 4px', ...props.style as Record<string, unknown> }}>
    {children}
  </ActionIcon>
);
