import { Stack } from '@mantine/core';
import React from 'react';

import { useSession } from 'client/data/SessionStore';

import { PageTitle } from '../design/PageTitle';
import { PageLayout } from '../layout/PageLayout';
import { PasswordView } from './PasswordChangeView';
import { ProfileImageView } from './ProfileImageView';
import { UserDataView } from './UserDataView';

export const ProfileView: React.FC = () => {
  const session = useSession();
  if (!session) return null;

  return (
    <PageLayout>
      <Stack p="md" maw={500} mx="auto">
        <PageTitle>Profiilitiedot</PageTitle>

        <UserDataView session={session} />
        <PasswordView session={session} my="xl" />
        <ProfileImageView session={session} />
      </Stack>
    </PageLayout>
  );
};
