import * as React from 'react';
import * as login from './data/login';
import BookkeeperPage from './ui/general/page';
import LoginPage from './ui/general/login-page';
import { Session } from '../shared/types/Session';
const debug = require('debug')('bookkeeper:app');

interface AppState {
    session: Session | null;
    initialized: boolean;
}

export default class App extends React.Component<{}, AppState> {

    public state: AppState = {
        session: null,
        initialized: false,
    };

    public async componentDidMount() {
        debug('Initializing bookkeeper client');
        login.currentSession.onValue(session => this.setState({ session }));
        
        await login.checkLoginState();
        this.setState({ initialized: true });
    }
  
    public render() {
        return (this.state.initialized) ?
            (this.state.session ? <BookkeeperPage session={this.state.session} /> : <LoginPage />) :
            <div />;
    }
}
