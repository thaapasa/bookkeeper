import { Box, Burger, Container, Group, GroupProps, type MantineSize, Text } from '@mantine/core';
import * as React from 'react';
import { Link, useMatch } from 'react-router-dom';

import { classNames } from 'client/ui/utils/classNames';
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

import { DateRangeNavigator } from '../component/DateRangeNavigator';
import { useIsMobile } from '../hooks/useBreakpoints';
import { Icon, RenderIcon } from '../icons/Icons';
import { AddExpenseMenu } from '../shortcuts/ShortcutsDropdown';
import { mainContentMaxWidth } from './Styles';
import classes from './TopBar.module.css';

export interface AppLink {
  label: string;
  path: string;
  /** Mantine breakpoint from which this link is visible in the header, or false to hide */
  showInHeader: MantineSize | false;
  icon?: Icon;
}

export const appLinks: AppLink[] = [
  { label: 'Linkit', path: shortcutsPagePath, showInHeader: false, icon: 'Shortcut' },
  { label: 'Kulut', path: expensePagePath, showInHeader: 'sm', icon: 'Money' },
  { label: 'Kategoriat', path: categoryPagePath, showInHeader: 'sm', icon: 'Category' },
  { label: 'Tilaukset', path: subscriptionsPagePath, showInHeader: 'sm', icon: 'Subscriptions' },
  { label: 'Tilastot', path: statisticsPage, showInHeader: 'md', icon: 'BarChart' },
  { label: 'Seuranta', path: trackingPagePath, showInHeader: 'sm', icon: 'Chart' },
  { label: 'Ryhmittelyt', path: groupingsPagePath, showInHeader: 'lg', icon: 'Grouping' },
  { label: 'Haku', path: searchPagePath, showInHeader: 'sm', icon: 'Search' },
  { label: 'Tiedot', path: infoPagePath, showInHeader: false, icon: 'Info' },
  { label: 'Työkalut', path: toolsPagePath, showInHeader: false, icon: 'Tools' },
];

const headerLinks = appLinks.filter(
  (l): l is AppLink & { showInHeader: MantineSize } => l.showInHeader !== false,
);

interface TopBarProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ menuOpen, onToggleMenu }) => {
  const isMobile = useIsMobile();
  return (
    <Container size={mainContentMaxWidth} h="100%" p={0}>
      <Group h="100%" px="md" gap={0}>
        <Burger
          opened={menuOpen}
          onClick={onToggleMenu}
          color="var(--mantine-color-text)"
          size="sm"
        />
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
              {headerLinks.map(l => (
                <HeaderNavLink key={l.label} link={l} />
              ))}
            </Group>
            <DateRangeNavigator />
            <Group ml="md">
              <AddExpenseMenu />
            </Group>
          </>
        )}
      </Group>
    </Container>
  );
};

/** Header nav link — text-based with active bottom-border indicator */
const HeaderNavLink: React.FC<{ link: AppLink & { showInHeader: MantineSize } } & GroupProps> = ({
  link,
  className,
  ...props
}) => {
  const active = !!useMatch(link.path);
  return (
    <Group
      renderRoot={props => <Link to={link.path} {...props} />}
      visibleFrom={link.showInHeader}
      align="center"
      h="100%"
      px="md"
      gap="xs"
      wrap="nowrap"
      c={active ? 'var(--mantine-color-text)' : 'neutral.7'}
      className={classNames(active ? classes.headerLinkActive : classes.headerLink, className)}
      {...props}
    >
      {link.icon && (
        <Box component="span" visibleFrom="md" display="inline-flex">
          <RenderIcon icon={link.icon} fontSize="small" />
        </Box>
      )}
      <Text size="md" fw={400} inherit={false}>
        {link.label}
      </Text>
    </Group>
  );
};
