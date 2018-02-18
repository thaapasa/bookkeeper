import * as React from 'react';
import UserAvatar from './UserAvatar';
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import { ToolbarGroup } from 'material-ui/Toolbar';
import * as colors from '../Colors';
import { logout, validSessionE } from '../../data/Login';
import { User, Group } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { createExpense } from '../../data/State';
import { AppBar } from 'material-ui';

interface TopBarProps {
  user: User;
  group: Group;
}

class TopBar extends React.Component<TopBarProps, {}> {

  public render() {
    return (
      <AppBar title={this.props.group.name}>
        <ToolbarGroup>
          {this.props.children}
        </ToolbarGroup>
        <ToolbarGroup style={{ align: 'right' }}>
          <RaisedButton label="Kirjaa" primary={true} onClick={createExpense} />
          <UserAvatar userId={this.props.user.id} size={44} />
          <IconButton iconClassName="material-icons" iconStyle={{ color: colors.tool }} onClick={logout}>exit_to_app</IconButton>
        </ToolbarGroup>
      </AppBar>
    );
  }

}

export default connect(validSessionE.map(s => ({ user: s.user, group: s.group })))(TopBar);
