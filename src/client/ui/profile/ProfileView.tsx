import { Grid } from '@mui/material';
import * as B from 'baconjs';
import React from 'react';

import { Session } from 'shared/types';
import { sessionP } from 'client/data/Login';

import { connect } from '../component/BaconConnect';
import { Title } from '../design/Text';
import { PageContentContainer } from '../Styles';
import { RequireProperty } from '../utils/RequireProperty';
import { PasswordChangeView } from './PasswordChangeView';
import { ProfileImageView } from './ProfileImageView';
import { UserDataView } from './UserDataView';

export const ProfileViewImpl = RequireProperty('session', ({ session }: { session: Session }) => {
  return (
    <PageContentContainer className="center">
      <Grid container columnSpacing={2} rowSpacing={2} padding={2} maxWidth={800}>
        <Grid item xs={12}>
          <Title>Profiilitiedot</Title>
        </Grid>
        <UserDataView session={session} />
        <PasswordChangeView />
        <ProfileImageView session={session} />
      </Grid>
    </PageContentContainer>
  );
});

export const ProfileView = connect(B.combineTemplate({ session: sessionP }))(ProfileViewImpl);
