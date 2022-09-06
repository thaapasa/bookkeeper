import { Button, Toolbar } from '@mui/material';
import * as React from 'react';
import { Link, Route } from 'react-router-dom';
import styled from 'styled-components';

import { gray, navigationBar } from '../Colors';
import { media } from '../Styles';
import { DateRangeNavigator } from './DateRangeNavigator';
import { ExpenseShortcutsView } from './ExpenseShortcutsView';

export interface AppLink {
  label: string;
  path: string;
  showInHeader: boolean;
}

interface NavigationBarProps {
  links?: AppLink[];
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ links }) => (
  <Bar>
    <LinkGroup>
      {links &&
        links
          .filter(l => l.showInHeader)
          .map(l => <LinkButton key={l.label} label={l.label} to={l.path} />)}
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
  min-height: auto;
  position: relative;
`;

const ToolbarGroup = styled.div``;

const LinkGroup = styled(ToolbarGroup)`
  flex: 1;
  justify-content: flex-start;
  align-items: center;
`;

const PadGroup = styled(ToolbarGroup)`
  width: 80px;
  ${media.largeDevice`
    width: inherit;
    flex: 1;
  `}
`;

const StyledButton = styled(Button)`
  margin-left: 10px;
  width: 140px;
`;

const PlainLink = styled(Link)`
  text-decoration: none;
`;

export const LinkButton: React.FC<{ label: string; to: string }> = ({
  label,
  to,
}) => (
  <Route path={to}>
    {({ match }) => (
      <PlainLink to={to}>
        <StyledButton
          variant="text"
          disableElevation
          color={match ? 'primary' : 'inherit'}
          style={match ? undefined : { color: gray.veryDark }}
        >
          {label}
        </StyledButton>
      </PlainLink>
    )}
  </Route>
);
