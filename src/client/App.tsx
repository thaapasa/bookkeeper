import * as React from 'react';
import BookkeeperPage from './ui/general/BookkeeperPage';
import LoginPage from './ui/general/LoginPage';
import { Session } from '../shared/types/Session';
import { sessionP, checkLoginState } from './data/Login';
import { Action } from '../shared/types/Common';
import { unsubscribeAll } from './util/ClientUtil';
import { windowSizeBus } from './data/State';
import { Size } from './ui/Types';
import debugSetup from 'debug';

const debug = debugSetup('bookkeeper:app');

interface AppState {
  session: Session | null;
  initialized: boolean;
  hasSize: boolean;
  windowSize: Size;
}

export default class App extends React.Component<{}, AppState> {

  private unsub: Action[] = [];

  public state: AppState = {
    session: null,
    initialized: false,
    hasSize: false,
    windowSize: { width: 0, height: 0 },
  };

  public async componentDidMount() {
    debug('Initializing bookkeeper client');
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
    this.setState({ hasSize: size.width > 0 && size.height > 0, windowSize: size });
  }

  public render() {
    return (this.state.initialized) ?
      (this.state.session && this.state.hasSize ?
        <BookkeeperPage session={this.state.session} windowSize={this.state.windowSize} /> :
        <LoginPage />) :
      null;
  }
}
