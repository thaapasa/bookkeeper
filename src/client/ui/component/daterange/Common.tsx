import styled from '@emotion/styled';
import { ActionIcon, type ActionIconProps } from '@mantine/core';
import React from 'react';

export {
  type DateRangeSelectorProps,
  type RangeType,
  type RangeTypeOrNone,
  type SelectorProps,
} from './dateRangeTypes';
export {
  isValidMonth,
  isValidYear,
  nextMonth,
  parseMonthRange,
  prevMonth,
  toMonthRange,
  toYearRange,
} from './dateRangeUtils';

export const NumberInput = styled.input`
  width: 64px;
  &.month {
    width: 42px;
  }
  margin: 0 2px;
  padding: 4px 8px;
  border: none;
  border-radius: var(--mantine-radius-sm);
  background: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.06));
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
  <ActionIcon
    variant="subtle"
    {...props}
    style={{ padding: 0, margin: '0 4px', ...(props.style as Record<string, unknown>) }}
  >
    {children}
  </ActionIcon>
);
