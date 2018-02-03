import * as React from 'react';
import * as B from 'baconjs';
import UserAvatar from './UserAvatar';
import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import { Toolbar, ToolbarGroup, ToolbarTitle } from 'material-ui/Toolbar';
import * as state from '../../data/State';
import * as colors from '../Colors';
import { logout, sessionP } from '../../data/Login';
import { User } from '../../../shared/types/Session';
import { connect } from './BaconConnect';

const buttonStyle = { float: 'right' };

interface TopBarProps {
  user: User;
}

class ConnectTest extends React.Component<{ user: User | null, text: string }, {}> {
  public render() { return <div>{this.props.user ? this.props.user.firstName : '-'}: {this.props.text}</div>; }
}

const Connected = connect(sessionP.map(s => ({ user: s ? s.user : null })))(ConnectTest);

export default class TopBar extends React.Component<TopBarProps, {}> {

  private handleClick = () => {
    state.editExpense(undefined);
  }

  public render() {
    return (
      <Toolbar className="top-bar fixed-horizontal">
        <ToolbarGroup className="optional">
          <ToolbarTitle text={state.getTitle()} />
        </ToolbarGroup>
        <ToolbarGroup>
          <Connected text="Hello" />
          {this.props.children}
        </ToolbarGroup>
        <ToolbarGroup style={{ align: 'right' }}>
          <RaisedButton label="Kirjaa" primary={true} style={buttonStyle} onClick={this.handleClick} />
          <UserAvatar userId={this.props.user.id} />
          <IconButton iconClassName="material-icons" iconStyle={{ color: colors.tool }} onClick={logout}>exit_to_app</IconButton>
        </ToolbarGroup>
      </Toolbar>
    );
  }

}
