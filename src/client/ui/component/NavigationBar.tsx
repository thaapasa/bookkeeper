import * as React from 'react';
import styled from 'styled-components';
import { ToolbarGroup } from 'material-ui/Toolbar';
import { Toolbar } from 'material-ui';
import { connect } from './BaconConnect';
import { navigationP } from '../../data/State';
import { Map } from '../../../shared/util/Objects';
import { Route, Link, withRouter, RouteComponentProps } from 'react-router-dom';
import FlatButton from 'material-ui/FlatButton';
import DateRangeNavigator from './DateRangeNavigator';
import { colorScheme } from '../Colors';
import { NavigationConfig } from '../../data/StateTypes';
import { AddExpenseIcon } from '../icons/AddExpenseIcon';
import { Size } from '../Types';
import { smallDeviceMaxWidth } from '../Styles';

export interface AppLink {
  label: string;
  path: string;
}

interface NavigationBarProps extends NavigationConfig, RouteComponentProps<{}> {
  links?: AppLink[];
  windowSize: Size;
}

export class NavigationBar extends React.Component<NavigationBarProps, {}> {
  public render() {
    const smallDevice = this.props.windowSize.width < smallDeviceMaxWidth;
    return (
      <Toolbar style={styles.toolbar}>
        <ToolbarGroup style={styles.links}>
          {this.props.links && this.props.links.map(l => <LinkButton key={l.label} label={l.label} to={l.path} />)}
        </ToolbarGroup>
        <ToolbarGroup>
          <DateRangeNavigator {...this.props} />
        </ToolbarGroup>
        <ToolbarGroup style={styles.pad} />
        <StyledAddExpenseIcon className={smallDevice ? 'small' : ''} />
      </Toolbar>
    );
  }
}

export default connect(navigationP)(withRouter(NavigationBar));

const StyledAddExpenseIcon = styled(AddExpenseIcon)`
  position: absolute;
  right: 27px;
  bottom: -21px;
  &.small {
    bottom: 6px;
    right: 11px;
  }
`;

export function LinkButton({ label, to }: { label: string, to: string }) {
  return (
    // tslint:disable-next-line jsx-no-lambda
    <Route path={to} children={({ match }) => (
        <Link to={to}>
          <FlatButton style={match ? selectedLinkStyle : linkStyle}>{label}</FlatButton>
        </Link>
      )} />
  );
}

const styles: Map<React.CSSProperties> = {
  toolbar: {
    position: 'relative',
    width: '100%',
  },
  links: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  pad: { flex: 1 },
};

const linkStyle: React.CSSProperties = {
  marginLeft: '10px',
  minWidth: '140px',
  color: colorScheme.primary.dark,
  textTransform: 'uppercase',
};

const selectedLinkStyle: React.CSSProperties = {
  ...linkStyle,
  color: colorScheme.secondary.standard,
};
