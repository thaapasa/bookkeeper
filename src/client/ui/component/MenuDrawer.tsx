import { Drawer, MenuItem, styled } from '@mui/material';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { Group, User } from 'shared/types';
import { config } from 'client/Config';
import { logout, validSessionE } from 'client/data/Login';
import { reloadApp } from 'client/util/ClientUtil';

import { colorScheme } from '../Colors';
import { RenderIcon } from '../icons/Icons';
import { connect } from './BaconConnect';
import { AppLink } from './NavigationBar';
import { UserAvatar } from './UserAvatar';

interface MenuDrawerProps extends RouteComponentProps {
  open: boolean;
  onRequestChange: (open: boolean) => void;
  user: User;
  group: Group;
  links?: AppLink[];
}

const MenuLink: React.FC<AppLink & { onSelect: (path: string) => void }> = ({
  onSelect,
  label,
  path,
  icon,
}) => (
  <MenuItem onClick={() => onSelect(path)}>
    <PaddedIcon icon={icon} fontSize="small" color="action" />
    {label}
  </MenuItem>
);

const MenuDrawerImpl: React.FC<MenuDrawerProps> = ({
  history,
  onRequestChange,
  open,
  group,
  user,
  links,
}) => {
  const onSelect = (path: string) => {
    history.push(path);
    onRequestChange(false);
  };
  const onClose = () => onRequestChange(false);
  const onReload = () => reloadApp();
  return (
    <Drawer open={open} anchor="left" onClose={onClose}>
      <GroupName>{group.name}</GroupName>
      <ItemArea>
        <UserInfo>
          <UserAvatar user={user} size={40} />
          <UserName>
            {user.firstName} {user.lastName}
          </UserName>
        </UserInfo>
      </ItemArea>
      <ItemArea>
        {links &&
          links.map(l => <MenuLink key={l.label} {...l} onSelect={onSelect} />)}
        <MenuLink
          label="Päivitä"
          showInHeader={false}
          path="/"
          onSelect={onReload}
          icon="Refresh"
        />
      </ItemArea>
      {links && links.length > 0 ? <Divider /> : null}
      <ItemArea className="bottom">
        <MenuInfo>
          Kukkaro {config.version} ({config.revision})
        </MenuInfo>
        <MenuItem onClick={logout}>Kirjaudu ulos</MenuItem>
      </ItemArea>
    </Drawer>
  );
};

export const MenuDrawer = withRouter(MenuDrawerImpl);

const GroupName = styled('div')`
  padding: 16px 24px;
  background-color: ${colorScheme.primary.standard};
  font-weight: bold;
  color: ${colorScheme.secondary.dark};
`;

const PaddedIcon = styled(RenderIcon)`
  margin-right: 8px;
`;

const ItemArea = styled('div')`
  margin: 4px 8px;

  &.bottom {
    margin-bottom: 16px;
  }
`;

const UserInfo = styled('div')`
  margin: 16px;
  padding-bottom: 16px;
  margin-bottom: 8px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  display: flex;
  border-bottom: 1px solid ${colorScheme.gray.standard};
`;

const UserName = styled('span')`
  padding-left: 16px;
  font-size: 16px;
`;

const Divider = styled('div')`
  border-bottom: 1px solid ${colorScheme.gray.standard};
  flex: 1;
  margin: 8px 24px;
`;

const MenuInfo = styled('div')`
  font-size: 9pt;
  padding: 2px 16px 8px 16px;
`;

export default connect(
  validSessionE.map(s => ({ user: s.user, group: s.group }))
)(MenuDrawer);
