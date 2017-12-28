import * as React from 'react';
import * as log from "../shared/util/log"
import * as login from "./data/login"
import BookkeeperPage from './ui/page';
import LoginPage from './ui/login-page';

interface AppState {
    session: any | undefined;
    initialized: boolean;
}

export default class App extends React.Component<{}, AppState> {

    public state: AppState = {
        session: undefined,
        initialized: false,
    };

    public async componentDidMount() {
        log.info("Initializing bookkeeper client");
        login.currentSession.onValue((u: string) => this.setState({ session: u }));
        
        await login.checkLoginState();
        this.setState({ initialized: true });
    }
  
    public render() {
        return (this.state.initialized) ?
            ((this.state.session === undefined) ? <LoginPage /> : <BookkeeperPage session={ this.state.session } />) :
            <div />;
    }
}
