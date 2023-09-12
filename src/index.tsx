/*
 * This is Bookkeeper client (web app) index file
 */

import ReactDOM from 'react-dom/client';

import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import * as React from 'react';

import { assertDefined } from 'shared/util';

import { App } from './client/App';
import { muiTheme } from './client/ui/Colors';

const container = document.getElementById('root');
assertDefined(container);
ReactDOM.createRoot(container).render(
  <ThemeProvider theme={muiTheme}>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <App />
    </LocalizationProvider>
  </ThemeProvider>,
);

// Uncomment the following to re-enable the service worker
// registerServiceWorker();
