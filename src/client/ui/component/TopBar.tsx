import * as React from 'react';
import UserAvatar from './UserAvatar';
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import * as colors from '../Colors';
import { logout, getTitle, validSessionE } from '../../data/Login';
import { User, Group } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { createExpense } from '../../data/State';

const buttonStyle = { float: 'right' };

interface TopBarProps {
  user: User;
  group: Group;
}

class TopBar extends React.Component<TopBarProps, {}> {

  public render() {
    return (
      <Toolbar className="top-bar fixed-horizontal">
        <ToolbarGroup className="optional">
          <ToolbarTitle text={getTitle(this.props.group)} />
        </ToolbarGroup>
        <ToolbarGroup>
          {this.props.children}
        </ToolbarGroup>
        <ToolbarGroup style={{ align: 'right' }}>
          <RaisedButton label="Kirjaa" primary={true} style={buttonStyle} onClick={createExpense} />
          <UserAvatar userId={this.props.user.id} />
          <IconButton iconClassName="material-icons" iconStyle={{ color: colors.tool }} onClick={logout}>exit_to_app</IconButton>
        </ToolbarGroup>
      </Toolbar>
    );
  }

}

export default connect(validSessionE.map(s => ({ user: s.user, group: s.group })))(TopBar);
