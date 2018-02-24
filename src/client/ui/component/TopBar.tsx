import * as React from 'react';
import * as B from 'baconjs';
import { ToolbarGroup } from 'material-ui/Toolbar';
import * as colors from '../Colors';
import { validSessionE } from '../../data/Login';
import { User, Group } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { windowSizeP } from '../../data/State';
import { AppBar } from 'material-ui';
import { Size } from '../Types';
import { Map } from '../../../shared/util/Objects';
import MenuDrawer from './MenuDrawer';

interface TopBarProps {
  user: User;
  group: Group;
  windowSize: Size;
}

interface TopBarState {
  menuOpen: boolean;
}

class TopBar extends React.Component<TopBarProps, TopBarState> {
  public state: TopBarState = {
    menuOpen: false,
  };

  public render() {
    return (
      <React.Fragment>
        <AppBar title={this.props.group.name} style={styles.topBar} onLeftIconButtonClick={this.toggleMenu}>
          <ToolbarGroup>
            {this.props.children}
          </ToolbarGroup>
        </AppBar>
        <MenuDrawer open={this.state.menuOpen} onRequestChange={this.changeMenu} />
      </React.Fragment>
    );
  }

  private toggleMenu = () => {
    this.setState(s => ({ menuOpen: !s.menuOpen }));
  }
  private changeMenu = (menuOpen: boolean) => {
    this.setState({ menuOpen });
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
