import styled from '@emotion/styled';
import * as B from 'baconjs';
import React from 'react';

import { Session } from 'shared/types';
import { sessionP } from 'client/data/Login';

import { connect } from '../component/BaconConnect';
import { Title } from '../design/Text';
import { PageContentContainer } from '../GlobalStyles';
import { RequireProperty } from '../utils/RequireProperty';
import { PasswordView } from './PasswordChangeView';
import { ProfileImageView } from './ProfileImageView';
import { UserDataView } from './UserDataView';

export const ProfileViewImpl = RequireProperty('session', ({ session }: { session: Session }) => {
  return (
    <PageContentContainer className="center">
      <FormGrid>
        <FullWidth>
          <Title>Profiilitiedot</Title>
        </FullWidth>
        <UserDataView session={session} />
        <PasswordView session={session} />
        <ProfileImageView session={session} />
      </FormGrid>
    </PageContentContainer>
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
