import * as React from 'react';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import * as login from '../data/login';
import * as apiConnect from '../data/api-connect';
import styled from 'styled-components';
import { CSSProperties } from 'react';
const debug = require('debug')('bookkeeper:login-page');

const paperStyle: CSSProperties = {
    margin: '20px',
    padding: '30px',
    textAlign: 'center',
    display: 'inline-block',
};

const titleStyle: CSSProperties = {
    height: '30px',
    display: 'inline-block',
    maxWidth: '250px',
};

const loginButtonStyle: CSSProperties = {
    margin: '30px',
};

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

    private handleLoginError = (er) => {
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

    private handleSubmit = async (event) => {
        event.preventDefault();
        this.setState({
            statusMessage: '',
            showStatusMessage: false,
        });
        try {
            const session = await apiConnect.login(this.state.username, this.state.password);
            login.loginStream.push(session);
            return null;
        } catch (e) {
            this.handleLoginError(e);
        }
    }

    public render() {
        return (
            <Page>
                <Paper style={paperStyle} zDepth={1}>
                    <form onSubmit={this.handleSubmit}>
                        <title style={titleStyle}>Kirjaudu sisään</title>
                        <br/>
                        <TextField
                            hintText="Käyttäjätunnus"
                            floatingLabelText="Käyttäjätunnus"
                            value={this.state.username}
                            onChange={(e, v) => this.setState({ username: v })}
                        /><br />
                        <TextField
                            hintText="Salasana"
                            floatingLabelText="Salasana"
                            type="password"
                            value={this.state.password}
                            onChange={(e, v) => this.setState({ password: v })}
                        /><br />
                        <RaisedButton
                            type="submit"
                            label="Kirjaudu"
                            primary={true}
                            style={loginButtonStyle}
                            /><br />
                        {this.state.showStatusMessage ? <title style={titleStyle}>{this.state.statusMessage}</title> : ""}
                    </form>
                </Paper>
            </Page>
        );
    }

}
