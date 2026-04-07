import * as React from 'react';

import { ExpenseType } from 'shared/expense';

import { Icons } from './Icons';

export function ExpenseTypeIcon(props: {
  type: ExpenseType;
  size?: number;
  color?: string;
}): React.ReactNode {
  const style = { width: props.size, height: props.size, color: props.color };
  switch (props.type) {
    case 'expense':
      return <Icons.Expense style={style} color="var(--mantine-color-primary-7)" />;
    case 'income':
      return <Icons.Income style={style} color="var(--mantine-color-primary-7)" />;
    case 'transfer':
      return <Icons.Transfer style={style} color="var(--mantine-color-neutral-7)" />;
    default:
      return null;
  }
}
