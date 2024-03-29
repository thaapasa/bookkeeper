import { AppBar, IconButton, styled, Toolbar, Typography } from '@mui/material';
import * as React from 'react';

import { Group, User } from 'shared/types';
import { validSessionE } from 'client/data/Login';

import * as colors from '../Colors';
import { useToggle } from '../hooks/useToggle';
import { AddExpenseNavButton } from '../icons/AddExpenseIcon';
import { Icons } from '../icons/Icons';
import { isMobileSize } from '../Styles';
import { Size } from '../Types';
import { connect } from './BaconConnect';
import { DateRangeNavigator } from './DateRangeNavigator';
import MenuDrawer from './MenuDrawer';
import { AppLink } from './NavigationBar';

interface TopBarProps {
  user: User;
  group: Group;
  links?: AppLink[];
  windowSize: Size;
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

const TopBarImpl: React.FC<TopBarProps> = ({ windowSize, group, links }) => {
  const [menuOpen, toggleMenu, setMenu] = useToggle();
  const isMobile = isMobileSize(windowSize);
  const title = isMobile ? undefined : group.name;

  return (
    <>
      <TopAppBar color="secondary" position="static">
        <TopToolBar className={`top-tool-bar ${isMobile ? 'mobile' : 'normal'}`}>
          <IconButton edge="start" aria-label="menu" size="small" onClick={toggleMenu}>
            <Icons.Menu style={styles.iconStyle} />
          </IconButton>
          {title ? <Title variant="h6">{title}</Title> : null}
          {isMobile ? (
            <>
              <DateRangeNavigator />
              <AddExpenseNavButton />
            </>
          ) : null}
        </TopToolBar>
      </TopAppBar>
      <MenuDrawer open={menuOpen} onRequestChange={setMenu} links={links} />
    </>
  );
};

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

export const TopBar = connect(validSessionE.map(s => ({ user: s.user, group: s.group })))(
  TopBarImpl,
);
