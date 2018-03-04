import * as React from 'react';
import * as colors from '../Colors';
import { validSessionE } from '../../data/Login';
import { User, Group } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { AppBar, ToolbarGroup } from 'material-ui';
import { Map } from '../../../shared/util/Objects';
import MenuDrawer from './MenuDrawer';
import { AppLink } from './NavigationBar';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { Size } from '../Types';
import { isMobileSize } from '../Styles';
import DateRangeNavigator from './DateRangeNavigator';

interface TopBarProps {
  user: User;
  group: Group;
  links?: AppLink[];
  windowSize: Size;
}

interface TopBarState {
  menuOpen: boolean;
}

class TopBar extends React.Component<TopBarProps, TopBarState> {
  public state: TopBarState = {
    menuOpen: false,
  };

  private getTitle() {
    return isMobileSize(this.props.windowSize) ? undefined : this.props.group.name;
  }

  private getContents() {
    return isMobileSize(this.props.windowSize) ? (
      <ToolbarGroup>
        <DateRangeNavigator />
        <AddExpenseIcon />
      </ToolbarGroup>
    ) : null;
  }

  public render() {
    return (
      <React.Fragment>
        <AppBar title={this.getTitle()} style={styles.topBar} onLeftIconButtonClick={this.toggleMenu}>
          {this.getContents()}
        </AppBar>
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
    justifyContent: 'center',
  },
};
