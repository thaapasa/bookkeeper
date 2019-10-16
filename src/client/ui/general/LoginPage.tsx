import * as React from 'react';
import styled from 'styled-components';
import { login } from '../../data/Login';
import { Card, TextField, Button } from '@material-ui/core';

interface LoginPageState {
  username: string;
  password: string;
  showStatusMessage: boolean;
  statusMessage: string;
}

export default class LoginPage extends React.Component<{}, LoginPageState> {
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
          <form onSubmit={this.handleSubmit}>
            <Title>Kirjaudu sisään</Title>
            <br />
            <EditField
              placeholder="Käyttäjätunnus"
              label="Käyttäjätunnus"
              value={this.state.username}
              onChange={this.setUserName}
            />
            <br />
            <EditField
              placeholder="Salasana"
              label="Salasana"
              type="password"
              value={this.state.password}
              onChange={this.setPassword}
            />
            <br />
            <LoginButton type="submit" color="primary" variant="contained">
              Kirjaudu
            </LoginButton>
            <br />
            {this.state.showStatusMessage ? (
              <Title>{this.state.statusMessage}</Title>
            ) : (
              ''
            )}
          </form>
        </LoginPaper>
      </Page>
    );
  }
}

const LoginPaper = styled(Card)`
  margin: 36px;
  padding: 36px;
  text-align: center;
  display: inline-block;
  z-index: 1;
`;

const EditField = styled(TextField)`
  margin: 8px 0px;
  width: 250px;
`;

const Title = styled.title`
  height: 30px;
  display: inline-block;
  max-width: 250px;
`;

const LoginButton = styled(Button)`
  margin: 30px;
`;

const Page = styled.div`
  margin: auto;
  text-align: center;
  background: url(${process.env.PUBLIC_URL || ''}/img/money-bg.jpg);
  background-size: cover;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
`;
