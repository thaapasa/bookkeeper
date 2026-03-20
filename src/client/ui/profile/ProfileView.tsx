import styled from '@emotion/styled';
import { Flex, ScrollArea } from '@mantine/core';
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
    <ScrollArea h="100%" type="auto" bg="neutral.1">
      <Flex direction="column" align="center">
        <FormGrid>
          <FullWidth>
            <Title>Profiilitiedot</Title>
          </FullWidth>
          <UserDataView session={session} />
          <PasswordView session={session} />
          <ProfileImageView session={session} />
        </FormGrid>
      </Flex>
    </ScrollArea>
  );
});

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  padding: 16px;
  max-width: 800px;
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

export const ProfileView = connect(B.combineTemplate({ session: sessionP }))(ProfileViewImpl);
