import * as React from 'react';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import styled from 'styled-components';
import { login } from '../../data/Login';

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
        statusMessage: 'Kirjautuminen epäonnistui. Ole hyvä ja tarkista käyttäjätunnuksesi ja salasanasi.',
        showStatusMessage: true,
      });
    } else {
      this.setState({
        statusMessage: 'Kirjautumisessa tapahtui virhe.',
        showStatusMessage: true,
      });
    }
  }

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
  }

  private setUserName = (_: any, username: string) => this.setState({ username });
  private setPassword = (_: any, password: string) => this.setState({ password });

  public render() {
    return (
      <Page>
        <LoginPaper zDepth={1}>
          <form onSubmit={this.handleSubmit}>
            <Title>Kirjaudu sisään</Title>
            <br />
            <TextField
              hintText="Käyttäjätunnus"
              floatingLabelText="Käyttäjätunnus"
              value={this.state.username}
              onChange={this.setUserName}
            /><br />
            <TextField
              hintText="Salasana"
              floatingLabelText="Salasana"
              type="password"
              value={this.state.password}
              onChange={this.setPassword}
            /><br />
            <LoginButton
              type="submit"
              label="Kirjaudu"
              primary={true}
            /><br />
            {this.state.showStatusMessage ? <Title>{this.state.statusMessage}</Title> : ''}
          </form>
        </LoginPaper>
      </Page>
    );
  }
}

const LoginPaper = styled(Paper) `
  margin: 36px;
  padding: 36px;
  text-align: center;
  display: inline-block;
`;

const Title = styled.title`
  height: 30px;
  display: inline-block;
  max-width: 250px;
`;

const LoginButton = styled(RaisedButton) `
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
