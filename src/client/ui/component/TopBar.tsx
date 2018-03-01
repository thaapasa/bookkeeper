import * as React from 'react';
import * as colors from '../Colors';
import { validSessionE } from '../../data/Login';
import { User, Group } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { AppBar } from 'material-ui';
import { Map } from '../../../shared/util/Objects';
import MenuDrawer from './MenuDrawer';
import { AppLink } from './NavigationBar';

interface TopBarProps {
  user: User;
  group: Group;
  links?: AppLink[];
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
        <AppBar title={this.props.group.name} style={styles.topBar} onLeftIconButtonClick={this.toggleMenu} />
        <MenuDrawer open={this.state.menuOpen} onRequestChange={this.changeMenu} links={this.props.links} />
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

export default connect(validSessionE.map(s => ({ user: s.user, group: s.group })))(TopBar);

const styles: Map<React.CSSProperties> = {
  topBar: {
    backgroundColor: colors.colorScheme.primary.dark,
  },
};
