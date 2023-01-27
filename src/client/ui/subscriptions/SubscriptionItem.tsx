import * as React from 'react';

import { RecurrencePeriod, RecurringExpense } from 'shared/expense';
import { Money } from 'shared/util';

import { Label, Period, RowElement, Sum } from './layout';

export const SubscriptionItem: React.FC<{
  item: RecurringExpense;
}> = ({ item }) => (
  <RowElement>
    <Label>{item.title}</Label>
    <Sum className="wide">{Money.from(item.sum).format()}</Sum>
    <Period>/ {getPeriodText(item.period)}</Period>
    <Sum>{Money.from(item.recurrencePerMonth).format()} / kk</Sum>
    <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
  </RowElement>
);

function getPeriodText({ unit, amount }: RecurrencePeriod) {
  switch (unit) {
    case 'years':
      return m(amount, `v`, `${amount} v`);
    case 'months':
      return m(amount, `kk`, `${amount} kk`);
    case 'weeks':
      return m(amount, `vko`, `${amount} viikkoa`);
    case 'days':
      return m(amount, `päivä`, `${amount} päivää`);
    case 'quarters':
      return m(amount, `kvartaali`, `${amount} kvartaalia`);
    default:
      return m(amount, unit, `${amount} ${unit}`);
  }
}

function m(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}
