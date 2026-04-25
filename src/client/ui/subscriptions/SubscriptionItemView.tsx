import { ActionIcon, Group, Loader, Menu, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';

import { RecurrencePeriod, Subscription } from 'shared/expense';
import { readableDateWithYear, RecurrenceInterval } from 'shared/time';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { invalidateSubscriptionData } from 'client/data/query';
import { executeOperation } from 'client/util/ExecuteOperation';

import { ExpanderIcon } from '../component/ExpanderIcon';
import { QueryBoundary } from '../component/QueryBoundary';
import { Icons } from '../icons/Icons';
import { NextDate, SubscriptionRow, Subtitle, Sum, Title, Tools } from './SubscriptionLayout';
import { SubscriptionMatchesView } from './SubscriptionMatchesView';

export const SubscriptionItemView: React.FC<{
  item: Subscription;
  range?: RecurrenceInterval;
}> = ({ item, range }) => {
  const [open, { toggle }] = useDisclosure(false);
  const stale = isStale(item);
  const ended = !!item.occursUntil || stale;
  const subtitle = buildSubtitle(item, stale);

  return (
    <>
      <SubscriptionRow bg={ended ? 'surface.1' : undefined} c={ended ? 'neutral.7' : undefined}>
        <Title>{item.title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <Sum>{Money.from(item.recurrencePerMonth).format()} / kk</Sum>
        <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
        <NextDate>{nextLine(item)}</NextDate>
        <Tools>
          <Group gap={2} wrap="nowrap" justify="flex-end">
            <ExpanderIcon title="Lisätiedot" open={open} onToggle={toggle} />
            <Menu shadow="md" width={220} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" aria-label="Toiminnot">
                  <Icons.More />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<Icons.Delete size={16} />}
                  color="red"
                  onClick={() => deleteSubscription(item)}
                >
                  {isLopetaAction(item) ? 'Lopeta tilaus' : 'Poista tilaus'}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Tools>
      </SubscriptionRow>
      {open ? <ExpandedDetails item={item} range={range} /> : null}
    </>
  );
};

const ExpandedDetails: React.FC<{
  item: Subscription;
  range: RecurrenceInterval | undefined;
}> = ({ item, range }) => (
  <Stack gap={4} px="md" py="xs" bg="surface.0">
    {item.recurrence ? (
      <Text size="sm" c="neutral.7">
        {item.occursUntil
          ? `Tilaus on päättynyt ${readableDateWithYear(item.occursUntil)}.`
          : item.nextMissing
            ? `Seuraava kirjaus ${readableDateWithYear(item.nextMissing)}.`
            : null}
      </Text>
    ) : null}
    {item.dominatedBy ? (
      <Text size="sm" c="orange.7">
        Tämän tilauksen kirjaukset omistaa jokin tarkempi tai vanhempi tilaus:{' '}
        <strong>{item.dominatedBy.title}</strong>. Tämä rivi näyttää tyhjältä — voit poistaa
        ylimääräisen tilauksen.
      </Text>
    ) : null}
    <QueryBoundary
      fallback={
        <Group py="xs">
          Ladataan kirjauksia ... <Loader size="xs" />
        </Group>
      }
    >
      <SubscriptionMatchesView subscription={item} range={range} />
    </QueryBoundary>
  </Stack>
);

/**
 * A recurring subscription that has run dry — `nextMissing` is in the
 * past and no realised rows landed in the current window. The user
 * almost certainly forgot to "lopeta tilaus", so we fade the row to
 * keep it from competing with active subscriptions.
 */
function isStale(item: Subscription): boolean {
  if (!item.recurrence) return false;
  if (item.occursUntil) return false;
  if (!item.nextMissing) return false;
  if (item.matchedCount > 0) return false;
  const today = new Date().toISOString().slice(0, 10);
  return item.nextMissing < today;
}

function buildSubtitle(item: Subscription, stale: boolean): React.ReactNode {
  if (item.dominatedBy) {
    return (
      <span>
        Päällekkäinen tilauksen kanssa: <strong>{item.dominatedBy.title}</strong>
      </span>
    );
  }
  const parts: string[] = [];
  const receiver = filterReceiver(item);
  if (receiver) parts.push(receiver);
  if (item.matchedCount > 0) {
    const range =
      item.firstDate && item.lastDate
        ? `${readableDateWithYear(item.firstDate)} – ${readableDateWithYear(item.lastDate)}`
        : '';
    parts.push(`${item.matchedCount} kpl${range ? ` · ${range}` : ''}`);
  } else if (!item.recurrence) {
    parts.push('Ei kirjauksia tarkasteluikkunassa');
  }
  if (stale) {
    parts.push('Tilaus on ollut hiljaa — lopeta se Toiminnot-valikosta');
  } else if (item.recurrence) {
    parts.push(`Toistuu ${getPeriodText(item.recurrence)}`);
  }
  return parts.join(' · ');
}

function filterReceiver(item: Subscription): string {
  return item.filter.receiver ?? item.filter.title ?? item.filter.search ?? '';
}

function nextLine(item: Subscription): string {
  if (!item.recurrence) return '';
  if (item.occursUntil) return `Päättyi ${readableDateWithYear(item.occursUntil)}`;
  if (item.nextMissing) return `Seur. ${readableDateWithYear(item.nextMissing)}`;
  return '';
}

function getPeriodText({ unit, amount }: RecurrencePeriod) {
  switch (unit) {
    case 'years':
      return m(amount, '1 v välein', `${amount} v välein`);
    case 'months':
      return m(amount, 'kuukausittain', `${amount} kk välein`);
    case 'weeks':
      return m(amount, 'viikoittain', `${amount} viikon välein`);
    case 'days':
      return m(amount, 'päivittäin', `${amount} päivän välein`);
    case 'quarters':
      return m(amount, 'neljännesvuosittain', `${amount} kvartaalin välein`);
    default:
      return `${amount} ${unit} välein`;
  }
}

function m(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

function isLopetaAction(item: Subscription): boolean {
  // Recurring rows that haven't been ended yet get the soft "lopeta"
  // path; anything else (already ended, or non-recurring) gets a real
  // delete. Server-side dispatch in deleteRecurringExpenseById mirrors
  // this so the click does what the label promises.
  return !!item.recurrence && !item.occursUntil;
}

async function deleteSubscription(item: Subscription) {
  const lopeta = isLopetaAction(item);
  const verb = lopeta ? 'lopettaa' : 'poistaa';
  await executeOperation(() => apiConnect.deleteSubscription(item.rowId), {
    confirm: `Haluatko ${verb} tilauksen ${item.title}?`,
    progress: 'Käsitellään...',
    success: lopeta ? 'Tilaus lopetettu' : 'Tilaus poistettu',
    postProcess: () => invalidateSubscriptionData(),
  });
}
