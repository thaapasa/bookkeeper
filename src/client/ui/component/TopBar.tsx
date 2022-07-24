import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { Group, User } from 'shared/types/Session';

import { validSessionE } from '../../data/Login';
import * as colors from '../Colors';
import { MenuIcon } from '../Icons';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { isMobileSize } from '../Styles';
import { Size } from '../Types';
import { connect } from './BaconConnect';
import DateRangeNavigator from './DateRangeNavigator';
import MenuDrawer from './MenuDrawer';
import { AppLink } from './NavigationBar';

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

  get isMobile() {
    return isMobileSize(this.props.windowSize);
  }

  get title() {
    return this.isMobile ? undefined : this.props.group.name;
  }

  private getContents() {
    return this.isMobile ? (
      <>
        <DateRangeNavigator />
        <AddExpenseIcon />
      </>
    ) : null;
  }

  public render() {
    return (
      <React.Fragment>
        <TopAppBar color="secondary" position="static">
          <TopToolBar
            className={`top-tool-bar ${this.isMobile ? 'mobile' : 'normal'}`}
          >
            <IconButton
              edge="start"
              aria-label="menu"
              size="small"
              onClick={this.toggleMenu}
            >
              <MenuIcon style={styles.iconStyle} />
            </IconButton>
            {this.title ? <Title variant="h6">{this.title}</Title> : null}
            {this.getContents()}
          </TopToolBar>
        </TopAppBar>
        <MenuDrawer
          open={this.state.menuOpen}
          onRequestChange={this.changeMenu}
          links={this.props.links}
        />
      </React.Fragment>
    );
  }

  private toggleMenu = () => this.setState(s => ({ menuOpen: !s.menuOpen }));

  private changeMenu = (menuOpen: boolean) => this.setState({ menuOpen });
}

const height = '56px';

const TopAppBar = styled(AppBar)`
  background-color: ${colors.colorScheme.primary.dark};
`;

const TopToolBar = styled(Toolbar)`
  height: ${height};
  display: flex;
  flex: 1 !important;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  &.mobile {
    justify-content: space-between;
  }
`;

const Title = styled(Typography)`
  margin-left: 8px;
`;

export default connect(
  validSessionE.map(s => ({ user: s.user, group: s.group }))
)(TopBar);
