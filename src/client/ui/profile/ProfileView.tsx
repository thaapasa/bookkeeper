import styled from '@emotion/styled';
import { Button, Grid } from '@mui/material';
import * as B from 'baconjs';
import React from 'react';

import { isEmail, Session } from 'shared/types';
import { sessionP } from 'client/data/Login';

import { connect } from '../component/BaconConnect';
import { TextEdit } from '../component/TextEdit';
import { Text, Title } from '../design/Text';
import { PageContentContainer } from '../Styles';
import { RequireProperty } from '../utils/RequireProperty';

export const ProfileViewImpl = RequireProperty('session', ({ session }: { session: Session }) => {
  const user = session.user;
  const [firstname, setFirstname] = React.useState(user.firstName);
  const [lastname, setLastname] = React.useState(user.lastName);
  const [email, setEmail] = React.useState(user.email);

  const reset = () => {
    setFirstname(user.firstName);
    setLastname(user.lastName);
    setEmail(user.email);
  };

  const emailValid = isEmail(email);
  const dataValid = firstname && lastname && emailValid;
  const changed =
    firstname !== user.firstName || lastname !== user.lastName || email !== user.email;

  return (
    <PageContentContainer className="center">
      <Grid container columnSpacing={2} rowSpacing={2} padding={2} maxWidth={800}>
        <Grid item xs={12}>
          <Title>Profiilitiedot</Title>
        </Grid>
        <ProfileItem title="Käyttäjä-id">
          <Text>{user.id}</Text>
        </ProfileItem>
        <ProfileItem title="Nimi">
          <TextEdit
            onChange={setFirstname}
            value={firstname}
            placeholder="Selma"
            width="120px"
            error={!firstname}
          />
          <TextEdit
            onChange={setLastname}
            value={lastname}
            placeholder="Säästäjä"
            width="200px"
            error={!lastname}
          />
        </ProfileItem>
        <ProfileItem title="Sähköposti">
          <TextEdit
            onChange={setEmail}
            value={email}
            placeholder="selma.saastaja@example.com"
            width="280px"
            error={!emailValid}
          />
        </ProfileItem>
        <ProfileItem>
          <Button color="primary" disabled={!dataValid || !changed} variant="contained">
            Tallenna
          </Button>
          <Button color="secondary" variant="contained" disabled={!changed} onClick={reset}>
            Palauta
          </Button>
        </ProfileItem>
      </Grid>
    </PageContentContainer>
  );
});

const ProfileItem: React.FC<React.PropsWithChildren<{ title?: string }>> = ({
  title,
  children,
}) => (
  <>
    <Grid item xs={3} alignSelf="center">
      <Text>{title}</Text>
    </Grid>
    <DataItemGrid item xs={9} alignSelf="center">
      {children}
    </DataItemGrid>
  </>
);

const DataItemGrid = styled(Grid)`
  & > div,
  & > button {
    margin-left: 16px;
  }
  & > div:first-of-type,
  & > button:first-of-type {
    margin-left: inherit !important;
  }
`;

export const ProfileView = connect(B.combineTemplate({ session: sessionP }))(ProfileViewImpl);
