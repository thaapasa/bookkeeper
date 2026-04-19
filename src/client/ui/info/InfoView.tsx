import { Stack } from '@mantine/core';
import * as React from 'react';

import { ObjectId, Source, User } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { useUserData, useValidSession } from 'client/data/SessionStore';

import { ActivatableTextField } from '../component/ActivatableTextField';
import { PageLayout } from '../layout/PageLayout';
import { InfoItem, ItemWithId, Label, Value } from './InfoLayoutElements';
import { VersionInfoView } from './VersionInfoView';

export const InfoView: React.FC = () => {
  const session = useValidSession();
  const userData = useUserData()!;

  return (
    <PageLayout>
      <Stack px={{ base: 'md', sm: 0 }}>
        <VersionInfoView />
        <UsersView user={session.user} userMap={userData.userMap} />
        <SourcesView sources={session.sources} />
      </Stack>
    </PageLayout>
  );
};

const UsersView: React.FC<{
  user: User;
  userMap: Record<string, User>;
}> = ({ user, userMap }) => (
  <>
    <InfoItem>
      <Label>Kirjautunut käyttäjä</Label>
      <Value>
        <ItemWithId id={user.id}>
          {user.firstName} {user.lastName}
        </ItemWithId>
      </Value>
    </InfoItem>
    <InfoItem>
      <Label>Käyttäjät</Label>
      <Value>
        {Object.values(userMap).map(v => (
          <ItemWithId key={v.id} id={v.id}>
            {v.firstName} {v.lastName}
          </ItemWithId>
        ))}
      </Value>
    </InfoItem>
  </>
);

const SourcesView: React.FC<{ sources: Source[] }> = ({ sources }) => {
  return (
    <InfoItem>
      <Label>Lähteet</Label>
      <Value>
        {Object.values(sources).map(s => (
          <ItemWithId key={s.id} id={s.id}>
            <ActivatableTextField
              value={s.name}
              onChange={name => renameSource(s.id, name)}
              width="360px"
            />
          </ItemWithId>
        ))}
      </Value>
    </InfoItem>
  );
};

async function renameSource(sourceId: ObjectId, name: string) {
  if (name) {
    await apiConnect.patchSource(sourceId, { name });
    await updateSession();
  }
}
