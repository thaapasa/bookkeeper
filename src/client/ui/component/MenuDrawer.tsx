import * as React from 'react';
import styled from 'styled-components';
import { User, Group } from 'shared/types/Session';
import { connect } from './BaconConnect';
import { validSessionE, logout } from 'client/data/Login';
import { UserAvatar } from './UserAvatar';
import { colorScheme } from '../Colors';
import { AppLink } from './NavigationBar';
import { RouteComponentProps, withRouter } from 'react-router';
import { Drawer, MenuItem } from '@material-ui/core';
import { reloadApp } from 'client/util/UrlUtils';
import { config } from 'client/Config';

interface MenuDrawerProps extends RouteComponentProps {
  open: boolean;
  onRequestChange: (open: boolean) => void;
  user: User;
  group: Group;
  links?: AppLink[];
}

class MenuLink extends React.Component<
  AppLink & { onSelect: (path: string) => void }
> {
  private onSelect = () => {
    this.props.onSelect(this.props.path);
  };
  public render() {
    return <MenuItem onClick={this.onSelect}>{this.props.label}</MenuItem>;
  }
}

class MenuDrawerImpl extends React.Component<MenuDrawerProps> {
  private onSelect = (path: string) => {
    this.props.history.push(path);
    this.props.onRequestChange(false);
  };
  private onClose = () => this.props.onRequestChange(false);
  public render() {
    return (
      <Drawer open={this.props.open} anchor="left" onClose={this.onClose}>
        <GroupName>{this.props.group.name}</GroupName>
        <ItemArea>
          <UserInfo>
            <UserAvatar user={this.props.user} size={40} />
            <UserName>
              {this.props.user.firstName} {this.props.user.lastName}
            </UserName>
          </UserInfo>
        </ItemArea>
        <ItemArea>
          {this.props.links &&
            this.props.links.map(l => (
              <MenuLink key={l.label} {...l} onSelect={this.onSelect} />
            ))}
          <MenuLink
            label="Päivitä"
            showInHeader={false}
            path="/"
            onSelect={this.onReload}
          />
        </ItemArea>
        {this.props.links && this.props.links.length > 0 ? <Divider /> : null}
        <ItemArea className="bottom">
          <MenuInfo>
            Kukkaro {config.version} ({config.revision})
          </MenuInfo>
          <MenuItem onClick={logout}>Kirjaudu ulos</MenuItem>
        </ItemArea>
      </Drawer>
    );
  }
  private onReload = () => reloadApp();
}

export const MenuDrawer = withRouter(MenuDrawerImpl);

const GroupName = styled.div`
  padding: 16px 24px;
  background-color: ${colorScheme.primary.standard};
  font-weight: bold;
  color: ${colorScheme.secondary.dark};
`;

const ItemArea = styled.div`
  margin: 4px 8px;

  &.bottom {
    margin-bottom: 16px;
  }
`;

const UserInfo = styled.div`
  margin: 16px;
  padding-bottom: 16px;
  margin-bottom: 8px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  display: flex;
  border-bottom: 1px solid ${colorScheme.gray.standard};
`;

const UserName = styled.span`
  padding-left: 16px;
  font-size: 16px;
`;

const Divider = styled.div`
  border-bottom: 1px solid ${colorScheme.gray.standard};
  flex: 1;
  margin: 8px 24px;
`;

const MenuInfo = styled.div`
  font-size: 9pt;
  padding: 2px 16px 8px 16px;
`;

export default connect(
  validSessionE.map(s => ({ user: s.user, group: s.group }))
)(MenuDrawer);
