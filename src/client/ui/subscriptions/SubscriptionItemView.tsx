import { ActionIcon, Box, Group, List, Loader, Menu, Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';

import { RecurrencePeriod, Subscription } from 'shared/expense';
import { readableDateWithYear, toISODate } from 'shared/time';
import { Money } from 'shared/util';
import { apiConnect } from 'client/data/ApiConnect';
import { invalidateSubscriptionData } from 'client/data/query';
import { executeOperation } from 'client/util/ExecuteOperation';

import { ExpanderIcon } from '../component/ExpanderIcon';
import { QueryBoundary } from '../component/QueryBoundary';
import { Icons } from '../icons/Icons';
import { SubscriptionEditorDialog } from './SubscriptionEditorDialog';
import { Kind, NextDate, SubscriptionRow, Subtitle, Sum, Title, Tools } from './SubscriptionLayout';
import { SubscriptionMatchesView } from './SubscriptionMatchesView';

type SubscriptionKind = 'active' | 'ended' | 'stats';

export const SubscriptionItemView: React.FC<{
  item: Subscription;
}> = ({ item }) => {
  const [open, { toggle }] = useDisclosure(false);
  const [editorOpen, { open: openEditor, close: closeEditor }] = useDisclosure(false);
  const stale = isStale(item);
  const kind = subscriptionKind(item, stale);
  const muted = kind !== 'active';
  const subtitle = buildSubtitle(item, kind, stale);

  return (
    <>
      <SubscriptionRow bg={muted ? 'surface.1' : undefined} c={muted ? 'neutral.7' : undefined}>
        <Kind>
          <KindIcon kind={kind} />
        </Kind>
        <Title>{item.title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <Sum visibleFrom="sm">{Money.from(item.recurrencePerMonth).format()} / kk</Sum>
        <Sum>{Money.from(item.recurrencePerYear).format()} / v</Sum>
        <NextDate>{nextLine(item, kind)}</NextDate>
        <Tools>
          <Group gap={2} wrap="nowrap" justify="flex-end">
            <ExpanderIcon title="Lisätiedot" open={open} onToggle={toggle} />
            {item.isPrimary ? (
              <Menu shadow="md" width={220} position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" aria-label="Toiminnot">
                    <Icons.More />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<Icons.Edit size={16} />} onClick={openEditor}>
                    Muokkaa…
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<Icons.Delete size={16} />}
                    color="red"
                    onClick={() => deleteSubscription(item, kind)}
                  >
                    {kind === 'active' ? 'Lopeta tilaus' : 'Poista tilaus'}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : null}
          </Group>
        </Tools>
      </SubscriptionRow>
      {open ? <ExpandedDetails item={item} /> : null}
      {item.isPrimary ? (
        // Re-key by item.id so a parent swap (e.g. quick filter change)
        // remounts the dialog with fresh state instead of leaving an
        // open editor bound to the previous item's data.
        <SubscriptionEditorDialog
          key={item.id}
          item={item}
          opened={editorOpen}
          onClose={closeEditor}
        />
      ) : null}
    </>
  );
};

const KindIcon: React.FC<{ kind: SubscriptionKind }> = ({ kind }) => {
  switch (kind) {
    case 'active':
      return (
        <Tooltip label="Aktiivinen tilaus — uusia kirjauksia luodaan automaattisesti">
          <Box component="span" display="inline-flex">
            <Icons.Recurring color="var(--mantine-color-primary-6)" />
          </Box>
        </Tooltip>
      );
    case 'ended':
      return (
        <Tooltip label="Päättynyt toistuva tilaus — uusia kirjauksia ei enää luoda">
          <Box component="span" display="inline-flex">
            <Icons.Recurring color="var(--mantine-color-neutral-5)" />
          </Box>
        </Tooltip>
      );
    case 'stats':
      return (
        <Tooltip label="Tilastotilaus — vain kirjausten ryhmittelyä, ei automaattisia kirjauksia">
          <Box component="span" display="inline-flex">
            <Icons.BarChart color="var(--mantine-color-neutral-6)" />
          </Box>
        </Tooltip>
      );
  }
};

const ExpandedDetails: React.FC<{
  item: Subscription;
}> = ({ item }) => (
  <Stack gap={4} px="md" bg="surface.0">
    {item.recurrence ? (
      <Text size="sm" c="neutral.7">
        {item.occursUntil
          ? `Tilaus on päättynyt ${readableDateWithYear(item.occursUntil)}.`
          : item.nextMissing
            ? `Seuraava kirjaus ${readableDateWithYear(item.nextMissing)}.`
            : null}
      </Text>
    ) : null}
    {item.dominatedBy?.kind === 'visible' ? (
      <Text size="sm" c="orange.7">
        Tämän tilauksen kirjaukset omistaa jokin tarkempi tai vanhempi tilaus:{' '}
        <strong>{item.dominatedBy.title}</strong>. Tämä rivi näyttää tyhjältä — voit poistaa
        ylimääräisen tilauksen.
      </Text>
    ) : item.dominatedBy?.kind === 'hidden' ? (
      <Text size="sm" c="orange.7">
        Tämän tilauksen kirjaukset omistaa toinen tilaus, joka on piilotettu nykyisillä
        suodattimilla. Tarkista esim. <strong>Näytä päättyneet</strong> -valinta nähdäksesi
        ristiriitaisen tilauksen.
      </Text>
    ) : null}
    <QueryBoundary
      fallback={
        <Group py="xs">
          Ladataan kirjauksia ... <Loader size="xs" />
        </Group>
      }
    >
      <SubscriptionMatchesView subscription={item} />
    </QueryBoundary>
  </Stack>
);

function subscriptionKind(item: Subscription, stale: boolean): SubscriptionKind {
  if (!item.recurrence) return 'stats';
  if (item.occursUntil || stale) return 'ended';
  return 'active';
}

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
  return item.nextMissing < toISODate();
}

function buildSubtitle(
  item: Subscription,
  kind: SubscriptionKind,
  stale: boolean,
): React.ReactNode {
  if (item.dominatedBy?.kind === 'visible') {
    return (
      <span>
        Päällekkäinen tilauksen kanssa: <strong>{item.dominatedBy.title}</strong>
      </span>
    );
  }
  if (item.dominatedBy?.kind === 'hidden') {
    return <span>Päällekkäinen piilotetun tilauksen kanssa</span>;
  }
  const parts: string[] = [];
  if (kind === 'stats') parts.push('Tilastotilaus');
  else if (kind === 'active' && item.recurrence)
    parts.push(`Toistuu ${getPeriodText(item.recurrence)}`);
  else if (kind === 'ended') parts.push('Päättynyt');

  const receiver = filterReceiver(item);
  if (receiver) parts.push(receiver);
  if (item.matchedCount > 0) {
    const range =
      item.firstDate && item.lastDate
        ? `${readableDateWithYear(item.firstDate)} – ${readableDateWithYear(item.lastDate)}`
        : '';
    parts.push(`${item.matchedCount} kpl${range ? ` · ${range}` : ''}`);
  } else if (kind === 'stats') {
    parts.push('Ei kirjauksia tarkasteluikkunassa');
  }
  if (stale) {
    parts.push('Tilaus on ollut hiljaa — lopeta se Toiminnot-valikosta');
  }
  return parts.join(' · ');
}

function filterReceiver(item: Subscription): string {
  return item.filter.receiver ?? item.filter.title ?? item.filter.search ?? '';
}

function nextLine(item: Subscription, kind: SubscriptionKind): string {
  if (kind === 'stats') return '';
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

async function deleteSubscription(item: Subscription, kind: SubscriptionKind) {
  const lopeta = kind === 'active';
  const mode = lopeta ? 'end' : 'delete';
  await executeOperation(() => apiConnect.deleteSubscription(item.rowId, mode), {
    confirmTitle: lopeta ? 'Lopeta tilaus' : 'Poista tilaus',
    confirm: <DeleteConfirmation item={item} kind={kind} />,
    progress: 'Käsitellään...',
    success: lopeta ? 'Tilaus lopetettu' : 'Tilaus poistettu',
    postProcess: () => invalidateSubscriptionData(),
  });
}

const DeleteConfirmation: React.FC<{ item: Subscription; kind: SubscriptionKind }> = ({
  item,
  kind,
}) => {
  return (
    <Stack gap="sm">
      <Text>
        {kind === 'active' ? (
          <>
            Lopetetaanko toistuva tilaus <strong>{item.title}</strong>?
          </>
        ) : (
          <>
            Poistetaanko tilaus <strong>{item.title}</strong>?
          </>
        )}
      </Text>
      <List size="sm" spacing={4} c="neutral.7">
        {item.lastDate ? (
          <List.Item>
            Viimeinen kirjaus: <strong>{readableDateWithYear(item.lastDate)}</strong>
          </List.Item>
        ) : kind !== 'stats' ? (
          <List.Item>Ei vielä yhtään kirjausta tällä tilauksella.</List.Item>
        ) : null}
        {kind === 'active' && item.nextMissing ? (
          <List.Item c="orange.7">
            Seuraava kirjaus olisi luotu: <strong>{readableDateWithYear(item.nextMissing)}</strong>{' '}
            — tätä ei enää luoda.
          </List.Item>
        ) : null}
        {kind === 'ended' && item.occursUntil ? (
          <List.Item>
            Tilaus on päättynyt: <strong>{readableDateWithYear(item.occursUntil)}</strong>
          </List.Item>
        ) : null}
        {kind === 'stats' ? (
          <List.Item>
            Kirjauksia tarkasteluikkunassa: <strong>{item.matchedCount} kpl</strong>
          </List.Item>
        ) : null}
      </List>
      <Text size="sm" c="neutral.7">
        {kind === 'active'
          ? 'Jo kirjatut kulut säilyvät — uusia kirjauksia ei luoda automaattisesti.'
          : 'Tilaus poistuu listalta. Aiemmin kirjatut kulut säilyvät.'}
      </Text>
    </Stack>
  );
};
