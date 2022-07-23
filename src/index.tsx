/*
 * This is Bookkeeper client (web app) index file
 */
import './index.css';

import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { assertDefined } from 'shared/util/Util';

import App from './client/App';
import { muiTheme } from './client/ui/Colors';

const container = document.getElementById('root');
assertDefined(container);
const root = createRoot(container);

root.render(
  <ThemeProvider theme={muiTheme}>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <App />
    </LocalizationProvider>
  </ThemeProvider>
);

// Uncomment the following to re-enable the service worker
// registerServiceWorker();
