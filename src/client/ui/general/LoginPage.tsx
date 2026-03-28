import styled from '@emotion/styled';
import { Button } from '@mantine/core';
import * as React from 'react';

import { pickRandomItem } from 'shared/util';
import { login } from 'client/data/Login';

import { primary } from '../Colors';
import { TextEdit } from '../component/TextEdit';

const publicUrl = import.meta.env.PUBLIC_URL || '';

const backgroundImages = ['money-bg.webp', 'money-bg-1.webp', 'money-bg-2.webp'];

export const LoginPage: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const bgImage = React.useMemo(() => pickRandomItem(backgroundImages), []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    try {
      await login(username, password);
    } catch (er: unknown) {
      if (er instanceof Object && 'status' in er && er.status === 401) {
        setStatusMessage(
          'Kirjautuminen epäonnistui. Ole hyvä ja tarkista käyttäjätunnuksesi ja salasanasi.',
        );
      } else {
        setStatusMessage('Kirjautumisessa tapahtui virhe.');
      }
    }
  };

  return (
    <Page bgImage={bgImage}>
      <LoginPaper>
        <Form onSubmit={handleSubmit}>
          <Title>Kirjaudu sisään</Title>
          <EditField
            placeholder="Käyttäjätunnus"
            label="Käyttäjätunnus"
            name="username"
            value={username}
            onChange={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect="off"
            autoFocus={true}
          />
          <EditField
            placeholder="Salasana"
            label="Salasana"
            name="password"
            type="password"
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect="off"
            value={password}
            onChange={setPassword}
          />
          <Button type="submit" fullWidth mt="xl">
            Kirjaudu
          </Button>
          {statusMessage !== null ? <ErrorText>{statusMessage}</ErrorText> : ''}
        </Form>
      </LoginPaper>
    </Page>
  );
};

const LoginPaper = styled.div`
  margin: 15vh 32px 32px 32px;
  padding: 32px;
  border-radius: var(--mantine-radius-md);
  background: var(--mantine-color-body);
  box-shadow: var(--mantine-shadow-sm);
  z-index: 1;
`;

const Form = styled.form`
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  width: 280px;
`;

const EditField = styled(TextEdit)`
  margin-top: 8px;
`;

const Title = styled.div`
  text-align: center;
  margin-bottom: 3vh;
`;

const ErrorText = styled.div`
  margin-top: 3vh;
  color: ${primary[7]};
  text-align: center;
`;

const Page = styled.div<{ bgImage: string }>`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  background: url(${publicUrl}/img/${props => props.bgImage});
  background-color: light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-8));
  background-size: cover;
  background-repeat: no-repeat;
  width: 100%;
  min-height: 100vh;

  @media screen and (max-width: var(--mantine-breakpoint-xs)) {
    background-size: 1024px;
    background-position: center top;
  }
`;
