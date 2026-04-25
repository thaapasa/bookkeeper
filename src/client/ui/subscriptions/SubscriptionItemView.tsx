import { ActionIcon, Group, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';

import { RecurrencePeriod, Subscription } from 'shared/expense';
import { readableDateWithYear } from 'shared/time';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { invalidateSubscriptionData } from 'client/data/query';
import { executeOperation } from 'client/util/ExecuteOperation';

import { ExpanderIcon } from '../component/ExpanderIcon';
import { QueryBoundary } from '../component/QueryBoundary';
import { Icons } from '../icons/Icons';
import { SubscriptionDetails } from './SubscriptionDetails';
import { Dates, Label, Period, SubscriptionRow, Sum, Tools } from './SubscriptionLayout';
import { SubscriptionMatchesView } from './SubscriptionMatchesView';

export const SubscriptionItemView: React.FC<{ item: Subscription }> = ({ item }) =>
  item.kind === 'recurring' ? (
    <RecurringSubscriptionItem item={item} />
  ) : (
    <ReportSubscriptionItem item={item} />
  );

const RecurringSubscriptionItem: React.FC<{ item: Subscription }> = ({ item }) => {
  const [open, { toggle }] = useDisclosure(false);
  const inactive = !!item.occursUntil;
  const templateSum = item.defaults?.sum;
  return (
    <>
      <SubscriptionRow
        bg={inactive ? 'surface.1' : undefined}
        c={inactive ? 'neutral.7' : undefined}
      >
        <Label>{item.title}</Label>
        <Label>{item.defaults?.receiver ?? ''}</Label>
        <Dates visibleFrom="sm">
          {item.firstDate ? readableDateWithYear(item.firstDate) : ''}
          {item.occursUntil ? ` - ${readableDateWithYear(item.occursUntil)}` : ''}
        </Dates>
        <Sum>{templateSum !== undefined ? Money.from(templateSum).format() : ''}</Sum>
        <Period>{item.recurrence ? `/ ${getPeriodText(item.recurrence)}` : ''}</Period>
        <Sum visibleFrom="sm">{Money.from(item.recurrencePerMonth).format()} / kk</Sum>
        <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
        <Tools>
          <ExpanderIcon title="Lisätiedot" open={open} onToggle={toggle} />
        </Tools>
      </SubscriptionRow>
      {open ? (
        <>
          <QueryBoundary
            fallback={
              <Group px="md" py="xs">
                Ladataan ... <Loader size="xs" />
              </Group>
            }
          >
            <SubscriptionDetails recurringExpenseId={item.rowId} />
          </QueryBoundary>
          <QueryBoundary
            fallback={
              <Group px="md" py="xs">
                Ladataan kirjauksia ... <Loader size="xs" />
              </Group>
            }
          >
            <SubscriptionMatchesView subscription={item} />
          </QueryBoundary>
        </>
      ) : null}
    </>
  );
};

const ReportSubscriptionItem: React.FC<{ item: Subscription }> = ({ item }) => {
  const [open, { toggle }] = useDisclosure(false);
  const avgSum =
    item.matchedCount > 0 ? Money.from(item.matchedSum).divide(item.matchedCount).toString() : '0';
  return (
    <>
      <SubscriptionRow>
        <Label>Toteutuma: {item.title}</Label>
        <Label>
          {item.matchedCount > 0
            ? `${item.matchedCount} tapahtuma${item.matchedCount !== 1 ? 'a' : ''} välillä ${readableDateWithYear(item.firstDate)} - ${readableDateWithYear(item.lastDate)}`
            : 'Ei kirjauksia tarkasteluikkunassa'}
        </Label>
        <Sum>{Money.from(item.matchedSum).format()}</Sum>
        <Sum>{Money.from(avgSum).format()}</Sum>
        <Period>/ kpl</Period>
        <Sum visibleFrom="sm">{Money.from(item.recurrencePerMonth).format()} / kk</Sum>
        <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
        <Tools>
          <Group gap={2} wrap="nowrap" justify="flex-end">
            <ExpanderIcon title="Lisätiedot" open={open} onToggle={toggle} />
            <ActionIcon title="Poista" onClick={() => deleteReport(item)}>
              <Icons.Delete />
            </ActionIcon>
          </Group>
        </Tools>
      </SubscriptionRow>
      {open ? (
        <QueryBoundary
          fallback={
            <Group px="md" py="xs">
              Ladataan kirjauksia ... <Loader size="xs" />
            </Group>
          }
        >
          <SubscriptionMatchesView subscription={item} />
        </QueryBoundary>
      ) : null}
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

async function deleteReport(item: Subscription) {
  await executeOperation(() => apiConnect.deleteReport(item.rowId), {
    confirm: `Haluatko poistaa raportin ${item.title}? Huom! Tämä poistaa kaikki raportin tuottamat rivit`,
    progress: 'Poistetaan raporttia...',
    success: 'Raportti poistettu!',
    postProcess: () => invalidateSubscriptionData(),
  });
}
