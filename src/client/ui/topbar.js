import React from 'react';
import FontIcon from 'material-ui/FontIcon';
import Avatar from 'material-ui/Avatar';
import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup, ToolbarTitle} from 'material-ui/Toolbar';
import * as state from "../data/state";

const buttonStyle = { float : "right"};
const avatarStyle = { float : "right"};

export default class ToolbarExamplesSimple extends React.Component {

    constructor(props) {
        super(props);
    }

    handleClick() {
        state.get("expenseDialogStream").push(undefined);
    }

    render() {
        const group = state.get("group");
        const groupName = group && group.name;
        const title = groupName ? `Kukkaro - ${groupName}` : "Kukkaro"
        return (
            <Toolbar>
                <ToolbarGroup>
                    <ToolbarTitle text={ title } />
                </ToolbarGroup>
                <ToolbarGroup style={{ align: "right" }}>
                    <RaisedButton label="Kirjaa" primary={true} style={buttonStyle} onTouchTap={this.handleClick} />
                    <Avatar style={avatarStyle}>{this.props.user.firstName.charAt(0)}</Avatar>
                </ToolbarGroup>
            </Toolbar>
        );
    }

}
