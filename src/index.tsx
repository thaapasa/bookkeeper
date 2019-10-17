/*
 * This is Bookkeeper client (web app) index file
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MomentUtils from '@date-io/moment';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { ThemeProvider } from '@material-ui/styles';
import { StylesProvider } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import registerServiceWorker from './client/registerServiceWorker';
import './index.css';
import App from './client/App';
import { muiTheme, muiThemeMUICore } from './client/ui/Colors';
import { fiLocale } from 'shared/types/Time';

ReactDOM.render(
  <StylesProvider injectFirst>
    <MuiThemeProvider muiTheme={muiTheme}>
      <ThemeProvider theme={muiThemeMUICore}>
        <MuiPickersUtilsProvider utils={MomentUtils} locale={fiLocale}>
          <App />
        </MuiPickersUtilsProvider>
      </ThemeProvider>
    </MuiThemeProvider>
  </StylesProvider>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
