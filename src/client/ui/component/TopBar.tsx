import styled from '@emotion/styled';
import { Burger, Button, Group, Text } from '@mantine/core';
import * as React from 'react';
import { Link, useMatch } from 'react-router-dom';

import {
  categoryPagePath,
  expensePagePath,
  groupingsPagePath,
  infoPagePath,
  searchPagePath,
  shortcutsPagePath,
  statisticsPage,
  subscriptionsPagePath,
  toolsPagePath,
  trackingPagePath,
} from 'client/util/Links';

import { colorScheme, gray } from '../Colors';
import { Icon, RenderIcon } from '../icons/Icons';
import { AddExpenseMenu } from '../shortcuts/ShortcutsDropdown';
import { isMobileSize } from '../Styles';
import { Size } from '../Types';
import { DateRangeNavigator } from './DateRangeNavigator';

export interface AppLink {
  label: string;
  path: string;
  showInHeader: boolean | number;
  icon?: Icon;
}

export const appLinks: AppLink[] = [
  { label: 'Linkit', path: shortcutsPagePath, showInHeader: false, icon: 'Shortcut' },
  { label: 'Kulut', path: expensePagePath, showInHeader: true, icon: 'Money' },
  { label: 'Kategoriat', path: categoryPagePath, showInHeader: true, icon: 'Category' },
  { label: 'Tilaukset', path: subscriptionsPagePath, showInHeader: true, icon: 'Subscriptions' },
  { label: 'Tilastot', path: statisticsPage, showInHeader: 1050, icon: 'BarChart' },
  { label: 'Seuranta', path: trackingPagePath, showInHeader: true, icon: 'Chart' },
  { label: 'Ryhmittelyt', path: groupingsPagePath, showInHeader: 1200, icon: 'Grouping' },
  { label: 'Haku', path: searchPagePath, showInHeader: true, icon: 'Search' },
  { label: 'Tiedot', path: infoPagePath, showInHeader: false, icon: 'Info' },
  { label: 'Työkalut', path: toolsPagePath, showInHeader: false, icon: 'Tools' },
];

interface TopBarProps {
  windowSize: Size;
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ windowSize, menuOpen, onToggleMenu }) => {
  const isMobile = isMobileSize(windowSize);
  return (
    <Group h="100%" px="md" gap={0}>
      <Burger opened={menuOpen} onClick={onToggleMenu} color={colorScheme.primary.text} size="sm" />
      {isMobile ? (
        <>
          <Group flex={1} justify="center" style={{ overflow: 'hidden' }}>
            <DateRangeNavigator />
          </Group>
          <AddExpenseMenu />
        </>
      ) : (
        <>
          <Group gap={0} flex={1} h="100%" ml="sm">
            {appLinks
              .filter(
                l =>
                  l.showInHeader === true ||
                  (typeof l.showInHeader === 'number' && windowSize.width > l.showInHeader),
              )
              .map(l => (
                <NavLink key={l.label} link={l} showIcon={windowSize.width > 920} />
              ))}
          </Group>
          <DateRangeNavigator />
          <Group ml="md">
            <AddExpenseMenu />
          </Group>
        </>
      )}
    </Group>
  );
};

/** Header nav link — text-based with active bottom-border indicator */
const NavLink: React.FC<{ link: AppLink; showIcon: boolean }> = ({ link, showIcon }) => {
  const active = !!useMatch(link.path);
  return (
    <HeaderLink to={link.path} $active={active}>
      <Group gap="xs" wrap="nowrap" align="center">
        {showIcon && link.icon && <RenderIcon icon={link.icon} fontSize="small" />}
        <Text size="sm" fw={active ? 600 : 400} inherit={false}>
          {link.label}
        </Text>
      </Group>
    </HeaderLink>
  );
};

const HeaderLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 var(--mantine-spacing-md);
  text-decoration: none;
  color: ${p => (p.$active ? colorScheme.primary.text : colorScheme.gray.veryDark)};
  box-shadow: ${p => (p.$active ? `inset 0 -2px 0 ${colorScheme.secondary.standard}` : 'none')};
  transition:
    background-color 150ms,
    color 150ms;

  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
    color: ${colorScheme.primary.text};
  }
`;

/** Button-style link for use in content areas (not the header nav) */
export const LinkButton: React.FC<{
  label: string;
  to: string;
  icon?: Icon;
}> = ({ label, to, icon }) => {
  const match = useMatch(to);
  return (
    <PlainLink to={to}>
      <Button
        variant="subtle"
        size="compact-sm"
        color={match ? 'accent' : 'dark'}
        leftSection={icon ? <RenderIcon icon={icon} /> : undefined}
        style={match ? undefined : { color: gray.veryDark }}
      >
        {label}
      </Button>
    </PlainLink>
  );
};

const PlainLink = styled(Link)`
  text-decoration: none;
`;
