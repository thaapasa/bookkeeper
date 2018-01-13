/*
 * This is Bookkeeper client (web app) index file 
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as injectTapEventPlugin from 'react-tap-event-plugin';
import * as log from './shared/util/log';
import registerServiceWorker from './client/registerServiceWorker';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import App from './client/App';
import './index.css';

(window as any).log = log;

injectTapEventPlugin();

ReactDOM.render(
    <MuiThemeProvider>
        <App />
    </MuiThemeProvider>, 
    document.getElementById('root') as HTMLElement
);
registerServiceWorker();
