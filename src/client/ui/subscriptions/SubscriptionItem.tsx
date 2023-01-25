import * as React from 'react';

import { RecurringExpense } from 'shared/expense';

export const SubscriptionItem: React.FC<{
  item: RecurringExpense;
}> = ({ item }) => (
  <div>
    <>
      {item.title} {item.sum} ({item.period.amount} {item.period.unit}) -{' '}
      {item.recurrencePerMonth} € / kk, {item.recurrencePerYear} € / v
    </>
  </div>
);
