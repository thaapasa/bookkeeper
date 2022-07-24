import debug from 'debug';
import * as React from 'react';

import { Action } from '../shared/types/Common';
import { Session } from '../shared/types/Session';
import { checkLoginState, sessionP } from './data/Login';
import { windowSizeBus } from './data/State';
import { BookkeeperPage } from './ui/general/BookkeeperPage';
import { LoginPage } from './ui/general/LoginPage';
import { AnyObject, Size } from './ui/Types';
import { unsubscribeAll } from './util/ClientUtil';

const log = debug('bookkeeper:app');

interface AppState {
  session: Session | null;
  initialized: boolean;
  hasSize: boolean;
  windowSize: Size;
}

export default class App extends React.Component<AnyObject, AppState> {
  private unsub: Action[] = [];

  public state: AppState = {
    session: null,
    initialized: false,
    hasSize: false,
    windowSize: { width: 0, height: 0 },
  };

  public async componentDidMount() {
    log('Initializing bookkeeper client');
    this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
    this.unsub.push(sessionP.onValue(session => this.setState({ session })));

    await checkLoginState();
    this.setState({ initialized: true });
  }

  public componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
    unsubscribeAll(this.unsub);
  }

  private updateWindowDimensions = () => {
    const size = { width: window.innerWidth, height: window.innerHeight };
    windowSizeBus.push(size);
    this.setState({
      hasSize: size.width > 0 && size.height > 0,
      windowSize: size,
    });
  };

  public render() {
    return this.state.initialized ? (
      this.state.session && this.state.hasSize ? (
        <BookkeeperPage
          session={this.state.session}
          windowSize={this.state.windowSize}
        />
      ) : (
        <LoginPage />
      )
    ) : null;
  }
}
