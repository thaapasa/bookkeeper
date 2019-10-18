import * as React from 'react';
import styled from 'styled-components';
import { Route, Link } from 'react-router-dom';
import DateRangeNavigator from './DateRangeNavigator';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { media } from '../Styles';
import { Button, Toolbar } from '@material-ui/core';

export interface AppLink {
  label: string;
  path: string;
}

interface NavigationBarProps {
  links?: AppLink[];
}

const styles: Record<string, React.CSSProperties> = {
  links: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  pad: { flex: 1 },
};

export default class NavigationBar extends React.Component<NavigationBarProps> {
  public render() {
    return (
      <Bar>
        <ToolbarGroup style={styles.links}>
          {this.props.links &&
            this.props.links.map(l => (
              <LinkButton key={l.label} label={l.label} to={l.path} />
            ))}
        </ToolbarGroup>
        <ToolbarGroup>
          <DateRangeNavigator />
        </ToolbarGroup>
        <ToolbarGroup style={styles.pad} />
        <StyledAddExpenseIcon />
      </Bar>
    );
  }
}

const Bar = styled(Toolbar)`
  background-color: #e3dfdd;
  min-height: inherit;
  position: relative;
`;

const ToolbarGroup = styled.div``;

export const StyledAddExpenseIcon = styled(AddExpenseIcon)`
  position: absolute;
  right: 27px;
  bottom: -21px;
  ${media.mobile`
    bottom: 6px;
    right: 11px;
  `}
`;

const StyledButton = styled(Button)`
  margin-left: 10px;
  width: 140px;
`;

const PlainLink = styled(Link)`
  text-decoration: none;
`;

export function LinkButton({ label, to }: { label: string; to: string }) {
  return (
    /* eslint-disable react/no-children-prop */
    <Route
      path={to}
      children={({ match }) => (
        <PlainLink to={to}>
          <StyledButton variant="text" color={match ? 'primary' : 'default'}>
            {label}
          </StyledButton>
        </PlainLink>
      )}
    />
  );
}
