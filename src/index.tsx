/*
 * This is Bookkeeper client (web app) index file
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import registerServiceWorker from './client/registerServiceWorker';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import App from './client/App';
import './index.css';
import { muiTheme, muiThemeMUICore } from './client/ui/Colors';
import { ThemeProvider } from '@material-ui/styles';
import { StylesProvider } from '@material-ui/core/styles';

ReactDOM.render(
  <StylesProvider injectFirst>
    <MuiThemeProvider muiTheme={muiTheme}>
      <ThemeProvider theme={muiThemeMUICore}>
        <MuiPickersUtilsProvider utils={MomentUtils}>
          <App />
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </MuiThemeProvider>
  </StylesProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
