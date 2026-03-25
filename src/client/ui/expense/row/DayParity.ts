import * as React from 'react';

import { UserExpense } from 'shared/expense';

export const DayParityContext = React.createContext<Record<number, number>>({});

/** Compute a map of expense ID → 0 or 1 parity, toggling on each date change */
export function computeDayParities(expenses: UserExpense[]): Record<number, number> {
  const result: Record<number, number> = {};
  let parity = 0;
  let lastDate = '';
  for (const e of expenses) {
    if (e.date !== lastDate && lastDate !== '') {
      parity = 1 - parity;
    }
    lastDate = e.date;
    result[e.id] = parity;
  }
  return result;
}
