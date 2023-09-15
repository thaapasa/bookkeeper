/*
 * This is Bookkeeper client (web app) index file
 */

import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayJs';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import * as React from 'react';
import ReactDOM from 'react-dom/client';

import { assertDefined } from 'shared/util';

import { App } from './client/App';
import { muiTheme } from './client/ui/Colors';

const container = document.getElementById('root');
assertDefined(container);
ReactDOM.createRoot(container).render(
  <ThemeProvider theme={muiTheme}>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <App />
    </LocalizationProvider>
  </ThemeProvider>,
);

// Uncomment the following to re-enable the service worker
// registerServiceWorker();
