import React from 'react';
import FontIcon from 'material-ui/FontIcon';
import Avatar from 'material-ui/Avatar';
import RaisedButton from 'material-ui/RaisedButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';


const groupStyle = { width: "100%" };
const buttonStyle = { float : "right"};

export default class ToolbarExamplesSimple extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            value: 3
        };
    }

    render() {
        return (
            <Toolbar>
                <ToolbarGroup style={ groupStyle }>
                    <ToolbarTitle text="Bookkeeper" />
                    <FontIcon className="muidocs-icon-custom-sort" />
                    <RaisedButton label="Kirjaa" primary={true} style={ buttonStyle }/>
                    <Avatar style="float: right">J</Avatar>
                </ToolbarGroup>
            </Toolbar>
        );
    }

}
