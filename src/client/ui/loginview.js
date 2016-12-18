import React from 'react';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

const apiConnect = require("../api-connect");

const paperStyle = {
    margin: "20px",
    padding: "30px",
    textAlign: 'center',
    display: 'inline-block'
};

const titleStyle = {
    height: "30px",
    display: "inline-block"
};

const loginButtonStyle = {
    margin: "30px"
};

export default class ToolbarExamplesSimple extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: ""
        };
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        console.log("Button clicked: ", this.state.username, this.state.password);
        apiConnect.login(this.state.username, this.state.password);
    }

    render() {
        return <div>
            <Paper style={paperStyle} zDepth={1}>
                <title style={titleStyle} >Kirjaudu sisään</title>
                <br/>
                <TextField
                    hintText="Käyttäjätunnus"
                    floatingLabelText="Käyttäjätunnus"
                    value={this.state.username}
                    onChange={e => this.setState({ username: e.target.value })}
                /><br />
                <TextField
                    hintText="Salasana"
                    floatingLabelText="Salasana"
                    type="password"
                    value={this.state.password}
                    onChange={e => this.setState({ password: e.target.value })}
                /><br />
                <RaisedButton label="Kirjaudu" primary={true} style={loginButtonStyle} onClick={this.handleClick}/>
            </Paper>
        </div>;
    }

}
