import { DEFAULT_THEME } from '@mantine/core';
import * as React from 'react';

import { ExpenseGroupingRef } from 'shared/types';

import { BookmarkIcon, BookmarkIconProps } from '../component/BookmarkIcon';

const defaultGroupingColor = DEFAULT_THEME.colors.blue[3];

type GroupedExpenseIconProps = {
  grouping: ExpenseGroupingRef;
} & BookmarkIconProps;

export const GroupedExpenseIcon: React.FC<GroupedExpenseIconProps> = ({
  grouping,
  className,
  ...props
}) => {
  const color = grouping.color ?? defaultGroupingColor;

  return (
    <BookmarkIcon tooltip={grouping.title} symbol={grouping.title[0]} color={color} {...props} />
  );
};
