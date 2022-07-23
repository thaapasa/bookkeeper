import { Button, Card, TextField } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { login } from 'client/data/Login';

import { colorScheme } from '../Colors';
import { media } from '../Styles';

const publicUrl = process.env.PUBLIC_URL || '';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<any>) => {
    event.preventDefault();
    setStatusMessage(null);
    try {
      await login(username, password);
    } catch (er: any) {
      if (er && er.status === 401) {
        setStatusMessage(
          'Kirjautuminen epäonnistui. Ole hyvä ja tarkista käyttäjätunnuksesi ja salasanasi.'
        );
      } else {
        setStatusMessage('Kirjautumisessa tapahtui virhe.');
      }
    }
  };

  return (
    <Page>
      <LoginPaper>
        <Form onSubmit={handleSubmit}>
          <Title>Kirjaudu sisään</Title>
          <EditField
            placeholder="Käyttäjätunnus"
            label="Käyttäjätunnus"
            value={username}
            onChange={i => setUsername(i.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus={true}
          />
          <EditField
            placeholder="Salasana"
            label="Salasana"
            type="password"
            autoCapitalize="off"
            autoCorrect="off"
            value={password}
            onChange={i => setPassword(i.target.value)}
          />
          <LoginButton type="submit" color="primary" variant="contained">
            Kirjaudu
          </LoginButton>
          {statusMessage !== null ? <ErrorText>{statusMessage}</ErrorText> : ''}
        </Form>
      </LoginPaper>
    </Page>
  );
};

const LoginPaper = styled(Card)`
  display: inline-block;
  margin: 15vh 32px 32px 32px;
  padding: 36px;
  z-index: 1;
`;

const Form = styled.form`
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 248px;
`;

const EditField = styled(TextField)`
  margin: 8px;
`;

const Title = styled.title`
  display: inline-block;
  height: 24px;
  margin-bottom: 3vh;
  font-size: 14pt;
`;

const ErrorText = styled.div`
  margin-top: 3vh;
  color: ${colorScheme.secondary.dark};
  text-align: center;
`;

const LoginButton = styled(Button)`
  display: inline-block;
  margin-top: 5vh;
`;

const Page = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  background: url(${publicUrl}/img/money-bg.jpg);
  background-color: #d6d6d6;
  background-size: cover;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;

  ${media.mobilePortrait`
    background-size: 1024px;
    background-position: center top;
  `}
`;
