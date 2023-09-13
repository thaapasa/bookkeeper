import * as React from 'react';

import { ExpenseType } from 'shared/expense';

import { Icons } from './Icons';

export function ExpenseTypeIcon(props: { type: ExpenseType; size?: number; color?: string }): any {
  const style = { width: props.size, height: props.size, color: props.color };
  switch (props.type) {
    case 'expense':
      return <Icons.Expense style={style} />;
    case 'income':
      return <Icons.Income style={style} />;
    case 'transfer':
      return <Icons.Transfer style={style} />;
    default:
      return null;
  }
}
