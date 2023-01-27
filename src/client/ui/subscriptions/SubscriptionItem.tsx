import * as React from 'react';

import { RecurringExpense } from 'shared/expense';

import { RowElement } from './SubscriptionLayout';

export const SubscriptionItem: React.FC<{
  item: RecurringExpense;
}> = ({ item }) => (
  <RowElement>
    <>
      {item.title} {item.sum} ({item.period.amount} {item.period.unit}) -{' '}
      {item.recurrencePerMonth} € / kk, {item.recurrencePerYear} € / v
    </>
  </RowElement>
);
