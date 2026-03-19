import styled from '@emotion/styled';
import { Drawer } from '@mantine/core';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { Group, User } from 'shared/types';
import { config } from 'client/Config';
import { logout, validSessionP } from 'client/data/Login';
import { reloadApp } from 'client/util/ClientUtil';
import { profilePagePath } from 'client/util/Links';

import { colorScheme } from '../Colors';
import { RenderIcon } from '../icons/Icons';
import { connect } from './BaconConnect';
import { AppLink } from './TopBar';
import { UserAvatar } from './UserAvatar';

interface MenuDrawerProps {
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
  <MenuItemRow onClick={() => onSelect(path)}>
    <MenuIcon icon={icon} fontSize="small" color="action" />
    {label}
  </MenuItemRow>
);

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  onRequestChange,
  open,
  group,
  user,
  links,
}) => {
  const navigate = useNavigate();
  const onSelect = (path: string) => {
    navigate(path);
    onRequestChange(false);
  };
  const onClose = () => onRequestChange(false);
  const onReload = () => reloadApp();
  return (
    <Drawer
      opened={open}
      onClose={onClose}
      position="left"
      size="xs"
      withCloseButton={false}
      styles={{ body: { padding: 0 } }}
    >
      <Header>{group.name}</Header>

      <UserSection onClick={() => onSelect(profilePagePath)}>
        <UserAvatar user={user} size={40} />
        <UserName>
          {user.firstName} {user.lastName}
        </UserName>
      </UserSection>

      <Divider />

      <Section>
        {links?.map(l => (
          <MenuLink key={l.label} {...l} onSelect={onSelect} />
        ))}
        <MenuLink
          label="Päivitä"
          showInHeader={false}
          path="/"
          onSelect={onReload}
          icon="Refresh"
        />
      </Section>

      <Divider />

      <Section>
        <MenuItemRow onClick={logout}>Kirjaudu ulos</MenuItemRow>
      </Section>

      <VersionInfo>
        Kukkaro {config.version} ({config.revision})
      </VersionInfo>
    </Drawer>
  );
};

const px = 16;

const Header = styled.div`
  padding: ${px}px ${px + 8}px;
  background-color: ${colorScheme.primary.standard};
  font-weight: bold;
  color: ${colorScheme.secondary.dark};
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  padding: ${px}px ${px + 8}px;
  cursor: pointer;

  &:hover {
    background-color: ${colorScheme.gray.light};
  }
`;

const UserName = styled.span`
  margin-left: ${px}px;
`;

const Section = styled.div`
  padding: 4px 8px;
`;

const MenuItemRow = styled.div`
  display: flex;
  align-items: center;
  padding: 10px ${px}px;
  cursor: pointer;
  border-radius: 4px;
  font-size: var(--mantine-font-size-sm);

  &:hover {
    background-color: ${colorScheme.gray.light};
  }
`;

const MenuIcon = styled(RenderIcon)`
  margin-right: 12px;
`;

const Divider = styled.div`
  border-bottom: 1px solid ${colorScheme.gray.standard};
  margin: 0 ${px}px;
`;

const VersionInfo = styled.div`
  font-size: var(--mantine-font-size-xs);
  padding: 8px ${px + 8}px 16px;
  color: ${colorScheme.gray.dark};
`;

export default connect(validSessionP.map(s => ({ user: s.user, group: s.group })))(MenuDrawer);
