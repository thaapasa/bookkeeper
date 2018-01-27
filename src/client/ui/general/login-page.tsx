import * as React from 'react';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import * as login from '../../data/login';
import * as apiConnect from '../../data/api-connect';
import styled from 'styled-components';
import { CSSProperties, FormEvent } from 'react';
const debug = require('debug')('bookkeeper:login-page');

const LoginPaper = styled(Paper)`
    margin: 20px;
    padding: 30px;
    text-align: center;
    display: inline-block;
`;

const Title = styled.title`
    height: 30px;
    display: inline-block;
    max-width: 250px;
`;

const LoginButton = styled(RaisedButton)`
    margin: 30px;
`;

const Page = styled.div`
    margin: auto;
    text-align: center;
`;

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

    private handleSubmit = async (event: FormEvent<any>) => {
        event.preventDefault();
        this.setState({
            statusMessage: '',
            showStatusMessage: false,
        });
        try {
            const session = await apiConnect.login(this.state.username, this.state.password);
            login.loginStream.push(session);
        } catch (e) {
            this.handleLoginError(e);
        }
    }

    public render() {
        return (
            <Page>
                <LoginPaper zDepth={1}>
                    <form onSubmit={this.handleSubmit}>
                        <Title>Kirjaudu sisään</Title>
                        <br/>
                        <TextField
                            hintText="Käyttäjätunnus"
                            floatingLabelText="Käyttäjätunnus"
                            value={this.state.username}
                            onChange={(_, v) => this.setState({ username: v })}
                        /><br />
                        <TextField
                            hintText="Salasana"
                            floatingLabelText="Salasana"
                            type="password"
                            value={this.state.password}
                            onChange={(_, v) => this.setState({ password: v })}
                        /><br />
                        <LoginButton
                            type="submit"
                            label="Kirjaudu"
                            primary={true}
                        /><br />
                        {this.state.showStatusMessage ? <Title>{this.state.statusMessage}</Title> : ""}
                    </form>
                </LoginPaper>
            </Page>
        );
    }

}
