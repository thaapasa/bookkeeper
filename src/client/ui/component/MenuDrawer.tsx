import {
  Box,
  Button,
  Divider,
  Drawer,
  Group as MantineGroup,
  NavLink,
  SegmentedControl,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import * as React from 'react';
import { useNavigate } from 'react-router';

import { Group, User } from 'shared/types';
import { config } from 'client/Config';
import { logout, validSessionP } from 'client/data/Login';
import { reloadApp } from 'client/util/ClientUtil';
import { profilePagePath } from 'client/util/Links';

import { Caption } from '../design/Text';
import { useBaconProperty } from '../hooks/useBaconState';
import { Icons, RenderIcon } from '../icons/Icons';
import { AppLink } from '../layout/TopBar';
import { UserAvatar } from './UserAvatar';

interface MenuDrawerProps {
  open: boolean;
  onRequestChange: (open: boolean) => void;
  links?: AppLink[];
}

interface MenuDrawerViewProps extends MenuDrawerProps {
  user: User;
  group: Group;
}

const colorSchemeOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: '☀️' },
  { value: 'dark', label: '🌙' },
];

const MenuDrawerView: React.FC<MenuDrawerViewProps> = ({
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
      <Text
        bg="primary.8"
        c="white"
        size="md"
        fw="bold"
        h={56}
        px="md"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        {group.name}
      </Text>

      <UnstyledButton w="100%" onClick={() => onSelect(profilePagePath)}>
        <MantineGroup p="md" px={24} gap="md">
          <UserAvatar user={user} size={40} />
          <Text>
            {user.firstName} {user.lastName}
          </Text>
        </MantineGroup>
      </UnstyledButton>

      <Divider mx="md" />

      <Box p={4} px={8}>
        {links?.map(l => (
          <NavLink
            key={l.label}
            label={l.label}
            leftSection={
              l.icon ? <RenderIcon icon={l.icon} fontSize="small" color="action" /> : undefined
            }
            onClick={() => onSelect(l.path)}
          />
        ))}
        <NavLink
          label="Päivitä"
          leftSection={<RenderIcon icon="Refresh" fontSize="small" color="action" />}
          onClick={onReload}
        />
      </Box>

      <Divider mx="md" />

      <MantineGroup p="10px 16px" gap={12}>
        <Icons.Palette fontSize="small" />
        <SegmentedControl
          value={colorScheme}
          onChange={v => setColorScheme(v as 'auto' | 'light' | 'dark')}
          data={colorSchemeOptions}
          size="sm"
          style={{ flex: 1 }}
        />
      </MantineGroup>

      <Divider mx="md" />

      <Box px="md" py={8}>
        <Button
          variant="light"
          color="red"
          fullWidth
          onClick={logout}
          leftSection={<Icons.Logout fontSize="small" />}
        >
          Kirjaudu ulos
        </Button>
      </Box>

      <Caption px={24} py={8}>
        Kukkaro {config.version} ({config.revision})
      </Caption>
    </Drawer>
  );
};

export const MenuDrawer: React.FC<MenuDrawerProps> = props => {
  const session = useBaconProperty(validSessionP);
  return <MenuDrawerView {...props} user={session.user} group={session.group} />;
};
