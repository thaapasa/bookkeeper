import { Badge, Group, Select, Stack, Table, TagsInput } from '@mantine/core';
import * as React from 'react';

import { CardLastDigits, ObjectId, Source, StatementFormat, User } from 'shared/types';
import { apiConnect } from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { notify } from 'client/data/NotificationStore';
import { useUserData, useValidSession } from 'client/data/SessionStore';

import { ActivatableTextField } from '../component/ActivatableTextField';
import { UserIdAvatar } from '../component/UserAvatar';
import { PageLayout } from '../layout/PageLayout';
import { statementFormatLabels } from '../statement/statementSources';
import { CurrencyRatesView } from './CurrencyRatesView';
import { IdBadge, InfoSection } from './InfoLayoutElements';
import { VersionInfoView } from './VersionInfoView';

export const InfoView: React.FC = () => {
  const session = useValidSession();
  const userData = useUserData()!;

  return (
    <PageLayout>
      <Stack px={{ base: 'md', sm: 0 }} pb="md" pt="md">
        <VersionInfoView />
        <UsersView currentUser={session.user} userMap={userData.userMap} />
        <SourcesView sources={session.sources} />
        <CurrencyRatesView currencies={session.currencies} />
      </Stack>
    </PageLayout>
  );
};

const UsersView: React.FC<{
  currentUser: User;
  userMap: Record<string, User>;
}> = ({ currentUser, userMap }) => (
  <InfoSection title="Käyttäjät">
    <Table highlightOnHover layout="fixed">
      <Table.Tbody>
        {Object.values(userMap).map(u => (
          <Table.Tr key={u.id}>
            <Table.Td w={60}>
              <IdBadge id={u.id} />
            </Table.Td>
            <Table.Td>
              {u.firstName} {u.lastName}
            </Table.Td>
            <Table.Td w={150} ta="right">
              {u.id === currentUser.id ? (
                <Badge variant="light" color="primary" radius="sm">
                  Kirjautunut
                </Badge>
              ) : null}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  </InfoSection>
);

const statementFormatOptions = [
  { value: '', label: 'Ei tiliotteita' },
  ...StatementFormat.options.map(f => ({ value: f, label: statementFormatLabels[f] })),
];

const SourcesView: React.FC<{ sources: Source[] }> = ({ sources }) => (
  <InfoSection
    title="Lähteet"
    caption="Napsauta nimeä muokataksesi sitä. Tiliotemuoto määrittää, minkä pankin tiliotteita lähteelle voi tuoda. Korttikenttiin listataan käyttäjän pankkikorttien viimeiset 4 numeroa; ne näytetään lähteen nimen perässä ja niillä tunnistetaan kortin käyttäjä tiliotteilta."
  >
    <Table layout="fixed">
      <Table.Tbody>
        {sources.map(s => (
          <React.Fragment key={s.id}>
            <Table.Tr>
              <Table.Td w={60}>
                <IdBadge id={s.id} />
              </Table.Td>
              <Table.Td>
                <ActivatableTextField
                  value={s.name}
                  onChange={name => renameSource(s.id, name)}
                  width="360px"
                />
              </Table.Td>
              <Table.Td w={160}>
                <Select
                  aria-label="Tiliotemuoto"
                  size="xs"
                  data={statementFormatOptions}
                  value={s.statementFormat ?? ''}
                  onChange={v => changeStatementFormat(s.id, v)}
                />
              </Table.Td>
            </Table.Tr>
            {s.users.length > 0 ? (
              <Table.Tr>
                <Table.Td />
                <Table.Td colSpan={2}>
                  <Group gap="md">
                    {s.users.map(u => (
                      <Group key={u.userId} gap="xs" wrap="nowrap">
                        <UserIdAvatar userId={u.userId} size="sm" />
                        <TagsInput
                          aria-label="Pankkikortit"
                          placeholder="esim. 1226"
                          size="xs"
                          w={220}
                          value={u.cards}
                          onChange={cards => changeSourceUserCards(s.id, u.userId, cards)}
                        />
                      </Group>
                    ))}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ) : null}
          </React.Fragment>
        ))}
      </Table.Tbody>
    </Table>
  </InfoSection>
);

async function renameSource(sourceId: ObjectId, name: string) {
  if (name) {
    await apiConnect.patchSource(sourceId, { name });
    await updateSession();
  }
}

async function changeStatementFormat(sourceId: ObjectId, value: string | null) {
  const statementFormat = value ? StatementFormat.parse(value) : null;
  await apiConnect.patchSource(sourceId, { statementFormat });
  await updateSession();
}

/**
 * Accepts a card's last 4 digits as-is, or a full masked card number pasted
 * from a bank statement ("401046******1226"), keeping only the last 4.
 */
function normalizeCardInput(tag: string): string | null {
  const trimmed = tag.trim();
  if (CardLastDigits.safeParse(trimmed).success) {
    return trimmed;
  }
  const masked = /^\d{6}\*{6}(\d{4})$/.exec(trimmed);
  return masked ? masked[1] : null;
}

async function changeSourceUserCards(sourceId: ObjectId, userId: ObjectId, tags: string[]) {
  const cards: string[] = [];
  for (const tag of tags) {
    const card = normalizeCardInput(tag);
    if (!card) {
      notify(`Virheellinen korttinumero: ${tag} (syötä kortin 4 viimeistä numeroa)`, {
        severity: 'warning',
      });
      return;
    }
    if (!cards.includes(card)) {
      cards.push(card);
    }
  }
  await apiConnect.updateSourceUserCards(sourceId, userId, cards);
  await updateSession();
}
