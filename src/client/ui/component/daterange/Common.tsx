import { ActionIcon, type ActionIconProps } from '@mantine/core';
import React from 'react';

import styles from './Common.module.css';

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

export const NumberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className,
  ...props
}) => (
  <input
    {...props}
    className={`${styles.numberInput}${className === 'month' ? ` ${styles.month}` : ''}`}
  />
);

export const StyledIconButton: React.FC<
  ActionIconProps & React.ButtonHTMLAttributes<HTMLButtonElement> & React.PropsWithChildren
> = ({ children, ...props }) => (
  <ActionIcon
    {...props}
    style={{ padding: 0, margin: '0 4px', ...(props.style as Record<string, unknown>) }}
  >
    {children}
  </ActionIcon>
);
