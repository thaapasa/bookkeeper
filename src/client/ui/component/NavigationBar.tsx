import { Button, styled, Toolbar } from '@mui/material';
import * as React from 'react';
import { Link, useMatch } from 'react-router-dom';

import { gray, navigationBar } from '../Colors';
import { Icon, RenderIcon } from '../icons/Icons';
import { Size } from '../Types';
import { DateRangeNavigator } from './DateRangeNavigator';
import { ExpenseShortcutsView } from './ExpenseShortcutsView';

export interface AppLink {
  label: string;
  path: string;
  showInHeader: boolean;
  icon?: Icon;
}

interface NavigationBarProps {
  links?: AppLink[];
  windowSize: Size;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  links,
  windowSize,
}) => (
  <Bar>
    <LinkGroup>
      {links &&
        links
          .filter(l => l.showInHeader)
          .map(l => (
            <LinkButton
              key={l.label}
              label={l.label}
              to={l.path}
              icon={windowSize.width > 920 ? l.icon : undefined}
            />
          ))}
    </LinkGroup>
    <ToolbarGroup>
      <DateRangeNavigator />
    </ToolbarGroup>
    <PadGroup />
    <ExpenseShortcutsView />
  </Bar>
);

const Bar = styled(Toolbar)`
  background-color: ${navigationBar};
  min-height: auto !important;
  position: relative;
`;

const ToolbarGroup = styled('div')``;

const LinkGroup = styled(ToolbarGroup)`
  flex: 1;
  justify-content: flex-start;
  align-items: center;
`;

const PadGroup = styled(ToolbarGroup)`
  width: 80px;
`;

const StyledButton = styled(Button)`
  margin-left: 8px;
  padding: 6px 16px;

  &:last-of-type {
    margin-left: 0;
  }
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
      <StyledButton
        variant="text"
        disableElevation
        color={match ? 'primary' : 'inherit'}
        style={match ? undefined : { color: gray.veryDark }}
        startIcon={<RenderIcon icon={icon} />}
      >
        {label}
      </StyledButton>
    </PlainLink>
  );
};
