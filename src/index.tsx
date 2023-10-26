/*
 * This is Bookkeeper client (web app) index file
 */

import './client/Init';

import { fiFI as coreFiFI } from '@mui/material/locale';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fiFI } from '@mui/x-date-pickers/locales';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import dayjs from 'dayjs';
import * as React from 'react';
import ReactDOM from 'react-dom/client';

import { assertDefined } from 'shared/util';
import { primaryPalette, secondaryPalette } from 'client/ui/Colors';

import { App } from './client/App';

export const muiTheme = createTheme(
  {
    palette: {
      primary: secondaryPalette,
      secondary: primaryPalette,
    },
  },
  fiFI,
  coreFiFI,
);

const container = document.getElementById('root');
assertDefined(container);
ReactDOM.createRoot(container).render(
  <ThemeProvider theme={muiTheme}>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fi" dateLibInstance={dayjs}>
      <App />
    </LocalizationProvider>
  </ThemeProvider>,
);
