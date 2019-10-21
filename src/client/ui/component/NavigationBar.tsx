import * as React from 'react';
import styled from 'styled-components';
import { Route, Link } from 'react-router-dom';
import { Button, Toolbar } from '@material-ui/core';
import DateRangeNavigator from './DateRangeNavigator';
import { media } from '../Styles';
import { CreateLinks } from './CreateLinks';
import { navigationBar } from '../Colors';

export interface AppLink {
  label: string;
  path: string;
  showInHeader: boolean;
}

interface NavigationBarProps {
  links?: AppLink[];
}

export default class NavigationBar extends React.Component<NavigationBarProps> {
  public render() {
    return (
      <Bar>
        <LinkGroup>
          {this.props.links &&
            this.props.links
              .filter(l => l.showInHeader)
              .map(l => (
                <LinkButton key={l.label} label={l.label} to={l.path} />
              ))}
        </LinkGroup>
        <ToolbarGroup>
          <DateRangeNavigator />
        </ToolbarGroup>
        <PadGroup />
        <AddExpenseLinks />
      </Bar>
    );
  }
}

const Bar = styled(Toolbar)`
  background-color: ${navigationBar};
  min-height: inherit;
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

export const AddExpenseLinks = styled(CreateLinks)`
  position: absolute;
  right: 27px;
  bottom: -21px;
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
