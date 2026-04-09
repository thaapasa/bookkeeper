import { ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';

import { ExpenseReport, RecurrencePeriod, RecurringExpense } from 'shared/expense';
import { readableDateWithYear, toISODate } from 'shared/time';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { updateExpenses } from 'client/data/State';
import { executeOperation } from 'client/util/ExecuteOperation';

import { ExpanderIcon } from '../component/ExpanderIcon';
import { Icons } from '../icons/Icons';
import { SubscriptionDetails } from './SubscriptionDetails';
import { Dates, Label, Period, SubscriptionRow, Sum, Tools } from './SubscriptionLayout';
import { SubscriptionItem } from './types';

export const SubscriptionItemView: React.FC<{
  item: SubscriptionItem;
}> = ({ item }) =>
  item.type === 'recurring' ? <RecurringExpenseItem item={item} /> : <ReportItem item={item} />;

const RecurringExpenseItem: React.FC<{
  item: RecurringExpense;
}> = ({ item }) => {
  const [open, { toggle }] = useDisclosure(false);
  const inactive = !!item.occursUntil;
  return (
    <>
      <SubscriptionRow
        bg={inactive ? 'neutral.1' : undefined}
        c={inactive ? 'neutral.7' : undefined}
      >
        <Label>{item.title}</Label>
        <Label>{item.receiver}</Label>
        <Dates visibleFrom="sm">
          {readableDateWithYear(item.firstOccurence)}
          {item.occursUntil ? ` - ${readableDateWithYear(item.occursUntil)}` : ''}
        </Dates>
        <Sum>{Money.from(item.sum).format()}</Sum>
        <Period>/ {getPeriodText(item.period)}</Period>
        <Sum visibleFrom="sm">{Money.from(item.recurrencePerMonth).format()} / kk</Sum>
        <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
        <Tools>
          <ExpanderIcon title="Lisätiedot" open={open} onToggle={toggle} />
        </Tools>
      </SubscriptionRow>
      {open ? <SubscriptionDetails recurringExpenseId={item.id} /> : null}
    </>
  );
};

const ReportItem: React.FC<{
  item: ExpenseReport;
}> = ({ item }) => (
  <SubscriptionRow>
    <Label>Toteutuma: {item.title}</Label>
    <Label>
      {item.count} tapahtuma
      {item.count !== 1 ? 'a' : ''} välillä {readableDateWithYear(item.firstDate)} -{' '}
      {readableDateWithYear(item.lastDate)}
    </Label>
    <Sum>{Money.from(item.sum).format()}</Sum>
    <Sum>{Money.from(item.avgSum).format()}</Sum>
    <Period>/ kpl</Period>
    <Sum visibleFrom="sm">{Money.from(item.recurrencePerMonth).format()} / kk</Sum>
    <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
    <Tools>
      <ActionIcon title="Poista" onClick={() => deleteReport(item)}>
        <Icons.Delete />
      </ActionIcon>
    </Tools>
  </SubscriptionRow>
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

async function deleteReport(item: ExpenseReport) {
  await executeOperation(() => apiConnect.deleteReport(item.reportId), {
    confirm: `Haluatko poistaa raportin ${item.title}? Huom! Tämä poistaa kaikki raportin tuottamat rivit`,
    progress: 'Poistetaan raporttia...',
    success: 'Raportti poistettu!',
    postProcess: () => updateExpenses(toISODate()),
  });
}
