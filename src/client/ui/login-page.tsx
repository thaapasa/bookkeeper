import * as React from 'react';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import * as login from "../data/login"
const debug = require('debug')('bookkeeper:login-page');

const apiConnect = require("../data/api-connect");

const paperStyle = {
    margin: "20px",
    padding: "30px",
    textAlign: 'center',
    display: 'inline-block'
};

const titleStyle = {
    height: "30px",
    display: "inline-block",
    maxWidth: "250px"
};

const loginButtonStyle = {
    margin: "30px"
};

export default class LoginPage extends React.Component<any, any> {

    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: "",
            showStatusMessage: false,
            statusMessage: "plaa"
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleLoginError = this.handleLoginError.bind(this);
    }

    handleLoginError(er) {
        if (er && er.status === 401) {
            this.setState({
                statusMessage: "Kirjautuminen epäonnistui. Ole hyvä ja tarkista käyttäjätunnuksesi ja salasanasi.",
                showStatusMessage : true
            })
        } else {
            this.setState({
                statusMessage: "Kirjautumisessa tapahtui virhe.",
                showStatusMessage : true
            })
        }
    }

    handleSubmit(event) {
        event.preventDefault();
        this.setState({
            statusMessage: "",
            showStatusMessage : false
        })
        apiConnect.login(this.state.username, this.state.password)
            .then(u => {
                debug("logged in", u);
                login.loginStream.push(u);
                return null;
            })
            .catch(this.handleLoginError);
    }

    public render() {
        return <div className="everything">
            <Paper style={paperStyle} zDepth={1}>
                <form onSubmit={this.handleSubmit}>
                    <title style={titleStyle} >Kirjaudu sisään</title>
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
        </div>;
    }

}
