/*
 * This is Bookkeeper client (web app) index file 
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as injectTapEventPlugin from 'react-tap-event-plugin';
import * as log from "./shared/util/log"
import * as login from "./client/data/login"
import registerServiceWorker from './client/registerServiceWorker';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import BookkeeperPage from './client/ui/page';
import LoginPage from './client/ui/login-page';
import './index.css';

(window as any).log = log;

injectTapEventPlugin();

interface BookkeeperState {
    session: any | undefined;
    initialized: boolean;
}

class Bookkeeper extends React.Component<{}, BookkeeperState> {

    public state: BookkeeperState = {
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
            //((this.state.session === undefined) ? <LoginPage /> : <BookkeeperPage session={ this.state.session } />) :
            <LoginPage /> :
            <div />;
    }
}

ReactDOM.render(
    <MuiThemeProvider>
        <Bookkeeper />
    </MuiThemeProvider>, 
    document.getElementById("root") as HTMLElement
);
registerServiceWorker();
