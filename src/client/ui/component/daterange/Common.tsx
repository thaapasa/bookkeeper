import { ActionIcon, type ActionIconProps, TextInput, TextInputProps } from '@mantine/core';
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

export const CompactInputText: React.FC<TextInputProps> = ({ className, ...props }) => (
  <TextInput
    variant="unstyled"
    styles={{ input: { height: 24, minHeight: 24, paddingInline: 8 } }}
    bg="var(--mantine-color-default-hover)"
    style={{ borderRadius: 4 }}
    {...props}
  />
);

export const StyledIconButton: React.FC<
  ActionIconProps & React.ButtonHTMLAttributes<HTMLButtonElement> & React.PropsWithChildren
> = ({ children, ...props }) => (
  <ActionIcon {...props} p={0} mx={4}>
    {children}
  </ActionIcon>
);
