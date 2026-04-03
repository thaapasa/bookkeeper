import { Box, Flex } from '@mantine/core';
import React from 'react';

import { sessionP } from 'client/data/Login';

import { Title } from '../design/Text';
import { useBaconProperty } from '../hooks/useBaconState';
import { PasswordView } from './PasswordChangeView';
import { ProfileImageView } from './ProfileImageView';
import { UserDataView } from './UserDataView';

export const ProfileView: React.FC = () => {
  const session = useBaconProperty(sessionP);
  if (!session) return null;

  return (
    <Flex direction="column" align="center">
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 16,
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
