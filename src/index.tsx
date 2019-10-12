/*
 * This is Bookkeeper client (web app) index file
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import registerServiceWorker from './client/registerServiceWorker';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import App from './client/App';
import './index.css';
import { muiTheme } from './client/ui/Colors';

ReactDOM.render(
  <MuiThemeProvider muiTheme={muiTheme}>
    <App />
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
