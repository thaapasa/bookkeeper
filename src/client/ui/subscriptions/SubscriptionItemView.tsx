import * as React from 'react';

import {
  ExpenseReport,
  RecurrencePeriod,
  RecurringExpense,
} from 'shared/expense';
import { readableDateWithYear } from 'shared/time';
import { Money } from 'shared/util';

import { ExpanderIcon } from '../component/ExpanderIcon';
import { useToggle } from '../hooks/useToggle';
import { Dates, Label, Period, RowElement, Sum, Tools } from './layout';
import { SubscriptionDetails } from './SubscriptionDetails';
import { SubscriptionItem } from './types';

export const SubscriptionItemView: React.FC<{
  item: SubscriptionItem;
  className?: string;
}> = ({ item, ...props }) =>
  item.type === 'recurring' ? (
    <RecurringExpenseItem item={item} {...props} />
  ) : (
    <ReportItem item={item} {...props} />
  );

const RecurringExpenseItem: React.FC<{
  item: RecurringExpense;
  className?: string;
}> = ({ item, className }) => {
  const [open, toggle] = useToggle(false);
  return (
    <>
      <RowElement
        className={`${className} ${item.occursUntil ? 'inactive' : undefined}`}
      >
        <Label>{item.title}</Label>
        <Label>{item.receiver}</Label>
        <Dates className="optional">
          {readableDateWithYear(item.firstOccurence)}
          {item.occursUntil
            ? ` - ${readableDateWithYear(item.occursUntil)}`
            : ''}
        </Dates>
        <Sum className="wide">{Money.from(item.sum).format()}</Sum>
        <Period>/ {getPeriodText(item.period)}</Period>
        <Sum className="optional">
          {Money.from(item.recurrencePerMonth).format()} / kk
        </Sum>
        <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
        <Tools>
          <ExpanderIcon title="Lisätiedot" open={open} onToggle={toggle} />
        </Tools>
      </RowElement>
      {open ? <SubscriptionDetails recurringExpenseId={item.id} /> : null}
    </>
  );
};

const ReportItem: React.FC<{
  item: ExpenseReport;
  className?: string;
}> = ({ item, className }) => {
  return (
    <>
      <RowElement className={`${className}`}>
        <Label>{item.title}</Label>

        <Sum className="wide">{Money.from(item.sum).format()}</Sum>
      </RowElement>
    </>
  );
};

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
