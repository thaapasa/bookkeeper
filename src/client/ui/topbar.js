import React from 'react';
import FontIcon from 'material-ui/FontIcon';
import Avatar from 'material-ui/Avatar';
import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup, ToolbarTitle} from 'material-ui/Toolbar';
import * as state from "../data/state";

const groupStyle = { width: "100%" };
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
        return (
            <Toolbar>
                <ToolbarGroup style={ groupStyle }>
                    <ToolbarTitle text="Bookkeeper" />
                    <FontIcon className="muidocs-icon-custom-sort" />
                    <RaisedButton label="Kirjaa" primary={true} style={buttonStyle} onTouchTap={this.handleClick} />
                    <Avatar style={avatarStyle}>{this.props.user.firstName.charAt(0)}</Avatar>
                </ToolbarGroup>
            </Toolbar>
        );
    }

}
