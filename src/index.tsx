/*
 * This is Bookkeeper client (web app) index file
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
const injectTapEventPlugin = require('react-tap-event-plugin');
import registerServiceWorker from './client/registerServiceWorker';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import App from './client/App';
import './index.css';
import { getMuiTheme } from 'material-ui/styles';
import { colorScheme } from './client/ui/Colors';

injectTapEventPlugin();

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: colorScheme.secondary.standard,
    accent1Color: colorScheme.primary.dark,
    textColor: colorScheme.text,
    secondaryTextColor: colorScheme.secondary.text,
    alternateTextColor: colorScheme.primary.light,
  },
  appBar: {
    height: 56,
  },
});

ReactDOM.render(
  <MuiThemeProvider muiTheme={muiTheme}>
    <App />
  </MuiThemeProvider>,
  document.getElementById('root') as HTMLElement,
);
registerServiceWorker();
