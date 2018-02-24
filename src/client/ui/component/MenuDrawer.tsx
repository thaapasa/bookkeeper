import * as React from 'react';
import styled from 'styled-components';
import { Drawer, MenuItem } from 'material-ui';
import { User } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { validSessionE, logout } from '../../data/Login';
import { UserAvatar } from './UserAvatar';
import { colorScheme } from '../Colors';

interface MenuDrawerProps {
  open: boolean;
  onRequestChange: (open: boolean) => void;
  user: User;
}

export class MenuDrawer extends React.Component<MenuDrawerProps, {}> {
  public render() {
    console.log(this.props.user);
    return (
      <Drawer open={this.props.open} docked={false} onRequestChange={this.props.onRequestChange}>
        <UserInfo>
          <UserAvatar user={this.props.user} size={40} />
          <UserName>{this.props.user.firstName} {this.props.user.lastName}</UserName>
        </UserInfo>
        <MenuItem onClick={logout}>Kirjaudu ulos</MenuItem>
      </Drawer>
    );
  }
}

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

export default connect(validSessionE.map(s => ({ user: s.user })))(MenuDrawer);
