import React from 'react';
import UserAvatar from "./user-avatar";
import RaisedButton from 'material-ui/RaisedButton';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import * as state from "../data/state";

const buttonStyle = { float : "right"};

export default class ToolbarExamplesSimple extends React.Component {

    constructor(props) {
        super(props);
    }

    handleClick() {
        state.get("expenseDialogStream").push(undefined);
    }

    render() {
        return (
            <Toolbar>
                <ToolbarGroup>
                    <ToolbarTitle text={ state.getTitle() } />
                </ToolbarGroup>
                <ToolbarGroup style={{ align: "right" }}>
                    <RaisedButton label="Kirjaa" primary={true} style={buttonStyle} onTouchTap={this.handleClick} />
                    <UserAvatar userId={this.props.user.id} />
                </ToolbarGroup>
            </Toolbar>
        );
    }

}
