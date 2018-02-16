import * as React from 'react';
import BookkeeperPage from './ui/general/BookkeeperPage';
import LoginPage from './ui/general/LoginPage';
import { Session } from '../shared/types/Session';
import { sessionP, checkLoginState } from './data/Login';
import { Action } from '../shared/types/Common';
import { unsubscribeAll } from './util/ClientUtil';
const debug = require('debug')('bookkeeper:app');

interface AppState {
  session: Session | null;
  initialized: boolean;
}

export default class App extends React.Component<{}, AppState> {

  private unsub: Action[] = [];

  public state: AppState = {
    session: null,
    initialized: false,
  };

  public async componentDidMount() {
    debug('Initializing bookkeeper client');
    this.unsub.push(sessionP.onValue(session => this.setState({ session })));

    await checkLoginState();
    this.setState({ initialized: true });
  }

  public componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  public render() {
    return (this.state.initialized) ?
      (this.state.session ? <BookkeeperPage session={this.state.session} /> : <LoginPage />) :
      null;
  }
}
