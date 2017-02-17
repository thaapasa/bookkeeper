import React from 'react';
import UserAvatar from "./user-avatar";
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from "material-ui/IconButton";
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import * as state from "../data/state";
import * as colors from "./colors";
import { logout } from "../data/login"

const buttonStyle = { float : "right" };

export default class ToolbarExamplesSimple extends React.Component {

    constructor(props) {
        super(props);
    }

    handleClick() {
        state.editExpense(undefined);
    }

    render() {
        return (
            <Toolbar className="top-bar">
                <ToolbarGroup className="optional">
                    <ToolbarTitle text={ state.getTitle() } />
                </ToolbarGroup>
                <ToolbarGroup style={{ align: "right" }}>
                    <RaisedButton label="Kirjaa" primary={true} style={buttonStyle} onTouchTap={this.handleClick} />
                    <UserAvatar userId={this.props.user.id} />
                    <IconButton iconClassName="material-icons" iconStyle={{ color: colors.tool }} onClick={logout}>exit_to_app</IconButton>
                </ToolbarGroup>
            </Toolbar>
        );
    }

}
