import styled from '@emotion/styled';
import { ActionIcon, Button } from '@mantine/core';
import * as React from 'react';
import { Link, useMatch } from 'react-router-dom';

import * as colors from '../Colors';
import { gray } from '../Colors';
import { useToggle } from '../hooks/useToggle';
import { AddExpenseNavButton } from '../icons/AddExpenseIcon';
import { Icon, Icons, RenderIcon } from '../icons/Icons';
import { ShortcutsDropdown } from '../shortcuts/ShortcutsDropdown';
import { isMobileSize } from '../Styles';
import { Size } from '../Types';
import { DateRangeNavigator } from './DateRangeNavigator';
import MenuDrawer from './MenuDrawer';

export interface AppLink {
  label: string;
  path: string;
  showInHeader: boolean | number;
  icon?: Icon;
}

interface TopBarProps {
  links?: AppLink[];
  windowSize: Size;
}

const TopBarImpl: React.FC<TopBarProps> = ({ links, windowSize }) => {
  const [menuOpen, toggleMenu, setMenu] = useToggle();
  const isMobile = isMobileSize(windowSize);

  return (
    <>
      <Bar>
        <ActionIcon
          variant="subtle"
          aria-label="menu"
          size="lg"
          onClick={toggleMenu}
          color={colors.colorScheme.primary.text}
        >
          <Icons.Menu />
        </ActionIcon>
        {isMobile ? (
          <>
            <MobileDateArea>
              <DateRangeNavigator />
            </MobileDateArea>
            <AddExpenseNavButton />
          </>
        ) : (
          <>
            <LinkGroup>
              {links
                ?.filter(
                  l =>
                    l.showInHeader === true ||
                    (typeof l.showInHeader === 'number' && windowSize.width > l.showInHeader),
                )
                .map(l => (
                  <LinkButton
                    key={l.label}
                    label={l.label}
                    to={l.path}
                    icon={windowSize.width > 920 ? l.icon : undefined}
                  />
                ))}
            </LinkGroup>
            <DateRangeNavigator />
            <PadGroup />
            <ShortcutsDropdown />
          </>
        )}
      </Bar>
      <MenuDrawer open={menuOpen} onRequestChange={setMenu} links={links} />
    </>
  );
};

export const TopBar = TopBarImpl;

const Bar = styled.div`
  background-color: ${colors.colorScheme.primary.dark};
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 8px;
  position: relative;
`;

const MobileDateArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LinkGroup = styled.div`
  flex: 1;
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  align-items: center;
  margin-left: 8px;
`;

const PadGroup = styled.div`
  width: 80px;
`;

const PlainLink = styled(Link)`
  text-decoration: none;
`;

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
