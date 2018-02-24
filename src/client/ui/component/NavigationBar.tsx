import * as React from 'react';
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

interface NavigationBarProps extends NavigationConfig, RouteComponentProps<{}> {
}

export class NavigationBar extends React.Component<NavigationBarProps, {}> {

  public render() {
    return (
      <Toolbar>
        <ToolbarGroup style={styles.links}>
          {this.props.children}
        </ToolbarGroup>
        <ToolbarGroup style={styles.navigator}>
          <DateRangeNavigator {...this.props} />
        </ToolbarGroup>
        <ToolbarGroup style={styles.pad} />
      </Toolbar>
    );
  }
}

export default connect(navigationP)(withRouter(NavigationBar));

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
  links: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  navigator: {},
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
