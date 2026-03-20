import styled from '@emotion/styled';
import { Divider, Drawer, SegmentedControl, Text, useMantineColorScheme } from '@mantine/core';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { Group, User } from 'shared/types';
import { config } from 'client/Config';
import { logout, validSessionP } from 'client/data/Login';
import { reloadApp } from 'client/util/ClientUtil';
import { profilePagePath } from 'client/util/Links';

import { neutral, primary } from '../Colors';
import { Icons, RenderIcon } from '../icons/Icons';
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

const colorSchemeOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: '☀️' },
  { value: 'dark', label: '🌙' },
];

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  onRequestChange,
  open,
  group,
  user,
  links,
}) => {
  const navigate = useNavigate();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
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

      <Divider mx={px} />

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

      <Divider mx={px} />

      <ThemeSection>
        <Icons.Palette fontSize="small" />
        <SegmentedControl
          value={colorScheme}
          onChange={v => setColorScheme(v as 'auto' | 'light' | 'dark')}
          data={colorSchemeOptions}
          size="xs"
          style={{ flex: 1 }}
        />
      </ThemeSection>

      <Divider mx={px} />

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

const Header: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Text
    bg={primary[8]}
    c="white"
    size="md"
    fw="bold"
    h={56}
    px="md"
    style={{ display: 'flex', alignItems: 'center' }}
  >
    {children}
  </Text>
);

const UserSection = styled.div`
  display: flex;
  align-items: center;
  padding: ${px}px ${px + 8}px;
  cursor: pointer;

  &:hover {
    background-color: ${neutral[1]};
  }
`;

const UserName = styled.span`
  margin-left: ${px}px;
`;

const Section = styled.div`
  padding: 4px 8px;
`;

const ThemeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px ${px}px;
`;

const MenuItemRow = styled.div`
  display: flex;
  align-items: center;
  padding: 10px ${px}px;
  cursor: pointer;
  border-radius: var(--mantine-radius-sm);
  font-size: var(--mantine-font-size-sm);

  &:hover {
    background-color: ${neutral[1]};
  }
`;

const MenuIcon = styled(RenderIcon)`
  margin-right: 12px;
`;

const VersionInfo = styled.div`
  font-size: var(--mantine-font-size-xs);
  padding: 8px ${px + 8}px 16px;
  color: ${neutral[5]};
`;

export default connect(validSessionP.map(s => ({ user: s.user, group: s.group })))(MenuDrawer);
