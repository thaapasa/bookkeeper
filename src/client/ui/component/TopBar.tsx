import * as React from 'react';
import UserAvatar from './UserAvatar';
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import * as state from '../../data/State';
import * as colors from '../Colors';
import { logout } from '../../data/Login';
import { User } from '../../../shared/types/Session';

const buttonStyle = { float : 'right' };

interface TopBarProps {
    user: User;
}

export default class TopBar extends React.Component<TopBarProps, {}> {

    private handleClick = () => {
        state.editExpense(undefined);
    }

    public render() {
        return (
            <Toolbar className="top-bar fixed-horizontal">
                <ToolbarGroup className="optional">
                    <ToolbarTitle text={state.getTitle()} />
                </ToolbarGroup>
                <ToolbarGroup>
                    { this.props.children }
                </ToolbarGroup>
                <ToolbarGroup style={{ align: 'right' }}>
                    <RaisedButton label="Kirjaa" primary={true} style={buttonStyle} onClick={this.handleClick} />
                    <UserAvatar userId={this.props.user.id} />
                    <IconButton iconClassName="material-icons" iconStyle={{ color: colors.tool }} onClick={logout}>exit_to_app</IconButton>
                </ToolbarGroup>
            </Toolbar>
        );
    }

}
