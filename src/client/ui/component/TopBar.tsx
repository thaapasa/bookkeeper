import * as React from 'react';
import * as colors from '../Colors';
import styled from 'styled-components';

import { validSessionE } from '../../data/Login';
import { User, Group } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import MenuDrawer from './MenuDrawer';
import { AppLink } from './NavigationBar';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { Size } from '../Types';
import { isMobileSize } from '../Styles';
import DateRangeNavigator from './DateRangeNavigator';
import { MenuIcon } from '../Icons';
import { AppBar, Toolbar, IconButton, Typography } from '@material-ui/core';

interface TopBarProps {
  user: User;
  group: Group;
  links?: AppLink[];
  windowSize: Size;
}

interface TopBarState {
  menuOpen: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    backgroundColor: colors.colorScheme.primary.dark,
    justifyContent: 'center',
  },
  titleStyle: {
    color: colors.colorScheme.primary.text,
  },
  iconStyle: {
    color: colors.colorScheme.primary.text,
    padding: 12,
  },
};

class TopBar extends React.Component<TopBarProps, TopBarState> {
  public state: TopBarState = {
    menuOpen: false,
  };

  get title() {
    return isMobileSize(this.props.windowSize)
      ? undefined
      : this.props.group.name;
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
        <AppBar color="secondary" position="static">
          <TopToolBar>
            <IconButton
              edge="start"
              aria-label="menu"
              size="small"
              onClick={this.toggleMenu}
            >
              <MenuIcon style={styles.iconStyle} />
            </IconButton>
            <Title variant="h6">{this.title}</Title>
            {this.getContents()}
          </TopToolBar>
        </AppBar>
        <MenuDrawer
          open={this.state.menuOpen}
          onRequestChange={this.changeMenu}
          links={this.props.links}
        />
      </React.Fragment>
    );
  }

  private toggleMenu = () => {
    this.setState(s => ({ menuOpen: !s.menuOpen }));
  };

  private changeMenu = (menuOpen: boolean) => {
    this.setState({ menuOpen });
  };
}

const TopToolBar = styled(Toolbar)`
  height: 56px;
`;

const ToolbarGroup = styled.div``;

const Title = styled(Typography)`
  margin-left: 8px;
`;

export default connect(
  validSessionE.map(s => ({ user: s.user, group: s.group }))
)(TopBar);
