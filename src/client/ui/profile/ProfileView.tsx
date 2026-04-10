import { Box, Flex } from '@mantine/core';
import React from 'react';

import { useSession } from 'client/data/SessionStore';

import { Title } from '../design/Text';
import { PasswordView } from './PasswordChangeView';
import { ProfileImageView } from './ProfileImageView';
import { UserDataView } from './UserDataView';

export const ProfileView: React.FC = () => {
  const session = useSession();
  if (!session) return null;

  return (
    <Flex direction="column" align="center">
      <Box
        display="grid"
        style={{
          gridTemplateColumns: 'auto 1fr',
          gap: 'var(--mantine-spacing-md)',
        }}
        p="md"
        maw={800}
      >
        <Box style={{ gridColumn: '1 / -1' }}>
          <Title>Profiilitiedot</Title>
        </Box>

        <UserDataView session={session} />
        <PasswordView session={session} />
        <ProfileImageView session={session} />
      </Box>
    </Flex>
  );
};
