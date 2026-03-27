import { Box, Flex } from '@mantine/core';
import * as B from 'baconjs';
import React from 'react';

import { Session } from 'shared/types';
import { sessionP } from 'client/data/Login';

import { connect } from '../component/BaconConnect';
import { Title } from '../design/Text';
import { RequireProperty } from '../utils/RequireProperty';
import { PasswordView } from './PasswordChangeView';
import { ProfileImageView } from './ProfileImageView';
import { UserDataView } from './UserDataView';

export const ProfileViewImpl = RequireProperty('session', ({ session }: { session: Session }) => {
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
});

export const ProfileView = connect(B.combineTemplate({ session: sessionP }))(ProfileViewImpl);
