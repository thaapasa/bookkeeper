import { Badge, Stack, Table } from '@mantine/core';
import * as React from 'react';

import { ObjectId, Source, User } from 'shared/types';
import { apiConnect } from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { useUserData, useValidSession } from 'client/data/SessionStore';

import { ActivatableTextField } from '../component/ActivatableTextField';
import { PageLayout } from '../layout/PageLayout';
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

const SourcesView: React.FC<{ sources: Source[] }> = ({ sources }) => (
  <InfoSection title="Lähteet" caption="Napsauta nimeä muokataksesi sitä">
    <Table layout="fixed">
      <Table.Tbody>
        {sources.map(s => (
          <Table.Tr key={s.id}>
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
          </Table.Tr>
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
