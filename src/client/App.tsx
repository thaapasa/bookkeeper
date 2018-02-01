import * as React from 'react';
import BookkeeperPage from './ui/general/BookkeeperPage';
import LoginPage from './ui/general/LoginPage';
import { Session } from '../shared/types/Session';
import { sessionP, checkLoginState } from './data/login';
import { Action } from '../shared/types/Common';
const debug = require('debug')('bookkeeper:app');

interface AppState {
  session: Session | null;
  initialized: boolean;
}

export default class App extends React.Component<{}, AppState> {

  private unsubscribe: Action;

  public state: AppState = {
    session: null,
    initialized: false,
  };

  public async componentDidMount() {
    debug('Initializing bookkeeper client');
    this.unsubscribe = sessionP.onValue(session => this.setState({ session }));

    await checkLoginState();
    this.setState({ initialized: true });
  }

  public componentWillUnmount() {
    this.unsubscribe();
  }

  public render() {
    return (this.state.initialized) ?
      (this.state.session ? <BookkeeperPage session={this.state.session} /> : <LoginPage />) :
      null;
  }
}
