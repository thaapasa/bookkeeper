/*
 * This is Bookkeeper client (web app) index file
 */
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import MomentUtils from '@date-io/moment';
import { ThemeProvider } from '@material-ui/styles';
import { StylesProvider } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import './index.css';
import App from './client/App';
import { muiTheme } from './client/ui/Colors';
import { fiLocale } from './shared/util/Time';
import { assertDefined } from 'shared/util/Util';

const container = document.getElementById('root');
assertDefined(container);
const root = createRoot(container);

root.render(
  <StylesProvider injectFirst>
    <ThemeProvider theme={muiTheme}>
      <MuiPickersUtilsProvider utils={MomentUtils} locale={fiLocale}>
        <App />
      </MuiPickersUtilsProvider>
    </ThemeProvider>
  </StylesProvider>
);

// Uncomment the following to re-enable the service worker
// registerServiceWorker();
