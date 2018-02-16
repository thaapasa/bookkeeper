/*
 * This is Bookkeeper client (web app) index file
 */
import * as React from 'react';
import ReactDOM from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';
import registerServiceWorker from './client/registerServiceWorker';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import App from './client/App';
import './index.css';

injectTapEventPlugin();

ReactDOM.render(
  <MuiThemeProvider>
    <App />
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement,
);
registerServiceWorker();
