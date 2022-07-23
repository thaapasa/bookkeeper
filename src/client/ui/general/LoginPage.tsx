import { Button, Card, TextField } from '@material-ui/core';
import * as React from 'react';
import styled from 'styled-components';

import { login } from 'client/data/Login';

import { colorScheme } from '../Colors';
import { media } from '../Styles';
import { AnyObject } from '../Types';

const publicUrl = process.env.PUBLIC_URL || '';

interface LoginPageState {
  username: string;
  password: string;
  showStatusMessage: boolean;
  statusMessage: string;
}

export default class LoginPage extends React.Component<
  AnyObject,
  LoginPageState
> {
  public state: LoginPageState = {
    username: '',
    password: '',
    showStatusMessage: false,
    statusMessage: '',
  };

  private handleLoginError = (er: any) => {
    if (er && er.status === 401) {
      this.setState({
        statusMessage:
          'Kirjautuminen epäonnistui. Ole hyvä ja tarkista käyttäjätunnuksesi ja salasanasi.',
        showStatusMessage: true,
      });
    } else {
      this.setState({
        statusMessage: 'Kirjautumisessa tapahtui virhe.',
        showStatusMessage: true,
      });
    }
  };

  private handleSubmit = async (event: React.FormEvent<any>) => {
    event.preventDefault();
    this.setState({
      statusMessage: '',
      showStatusMessage: false,
    });
    try {
      await login(this.state.username, this.state.password);
    } catch (e) {
      this.handleLoginError(e);
    }
  };

  private setUserName = (event: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ username: event.target.value });
  private setPassword = (event: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ password: event.target.value });

  public render() {
    return (
      <Page>
        <LoginPaper>
          <Form onSubmit={this.handleSubmit}>
            <Title>Kirjaudu sisään</Title>
            <EditField
              placeholder="Käyttäjätunnus"
              label="Käyttäjätunnus"
              value={this.state.username}
              onChange={this.setUserName}
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
              value={this.state.password}
              onChange={this.setPassword}
            />
            <LoginButton type="submit" color="primary" variant="contained">
              Kirjaudu
            </LoginButton>
            {this.state.showStatusMessage ? (
              <ErrorText>{this.state.statusMessage}</ErrorText>
            ) : (
              ''
            )}
          </Form>
        </LoginPaper>
      </Page>
    );
  }
}

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
  margin: 8px 0px;
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
