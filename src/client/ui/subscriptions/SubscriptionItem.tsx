import { IconButton } from '@mui/material';
import * as React from 'react';

import { RecurrencePeriod, RecurringExpense } from 'shared/expense';
import { readableDateWithYear } from 'shared/time';
import { ObjectId } from 'shared/types';
import { Money } from 'shared/util';

import { Icons } from '../icons/Icons';
import { Dates, Label, Period, RowElement, Sum } from './layout';
import { RecurrenceTotals } from './types';

export type ToggleCategoryVisibility = (
  isVisible: boolean,
  categoryId: ObjectId
) => void;

export const SubscriptionItem: React.FC<{
  item: RecurringExpense;
}> = ({ item }) => (
  <RowElement>
    <Label>{item.title}</Label>
    <Dates className="optional">
      {readableDateWithYear(item.firstOccurence)}
      {item.occursUntil ? ` - ${readableDateWithYear(item.occursUntil)}` : ''}
    </Dates>
    <Sum className="wide">{Money.from(item.sum).format()}</Sum>
    <Period>/ {getPeriodText(item.period)}</Period>
    <Sum className="optional">
      {Money.from(item.recurrencePerMonth).format()} / kk
    </Sum>
    <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
  </RowElement>
);

export const SubscriptionCategoryHeader: React.FC<{
  title: string;
  totals?: RecurrenceTotals;
  className?: string;
  visible?: boolean;
  categoryId?: ObjectId;
  setVisible?: ToggleCategoryVisibility;
}> = ({ title, totals, className, visible = true, setVisible, categoryId }) => (
  <RowElement className={className}>
    <Label>
      {categoryId && setVisible ? (
        <IconButton onClick={() => setVisible(!visible, categoryId)}>
          {visible ? <Icons.Visible /> : <Icons.Hidden />}
        </IconButton>
      ) : null}
      {title}
    </Label>
    {totals ? (
      <>
        <Sum className="optional">
          {Money.from(totals.recurrencePerMonth).format()} / kk
        </Sum>
        <Sum>{Money.from(totals.recurrencePerYear).format()} / v</Sum>
      </>
    ) : null}
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
