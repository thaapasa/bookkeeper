import * as React from 'react';
import * as B from 'baconjs';
import UserAvatar from './UserAvatar';
import IconButton from 'material-ui/IconButton';
import { ToolbarGroup } from 'material-ui/Toolbar';
import * as colors from '../Colors';
import { logout, validSessionE } from '../../data/Login';
import { User, Group } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { windowSizeP } from '../../data/State';
import { AppBar } from 'material-ui';
import { Size } from '../Types';
import { Map } from '../../../shared/util/Objects';

interface TopBarProps {
  user: User;
  group: Group;
  windowSize: Size;
}

class TopBar extends React.Component<TopBarProps, {}> {
  public render() {
    return (
      <AppBar title={this.props.group.name} style={styles.topBar}>
        <ToolbarGroup>
          {this.props.children}
        </ToolbarGroup>
        <ToolbarGroup style={{ align: 'right' }}>
          <UserAvatar userId={this.props.user.id} size={44} />
          <IconButton iconClassName="material-icons" iconStyle={{ color: colors.tool }} onClick={logout}>exit_to_app</IconButton>
        </ToolbarGroup>
      </AppBar>
    );
  }
}

export default connect(B.combineTemplate<any, { user: User, group: Group, windowSize: Size }>({
  user: validSessionE.map(s => s.user),
  group: validSessionE.map(s => s.group),
  windowSize: windowSizeP,
}))(TopBar);

const styles: Map<React.CSSProperties> = {
  topBar: {
    backgroundColor: colors.colorScheme.primary.dark,
  },
};
