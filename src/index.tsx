/*
 * This is Bookkeeper client (web app) index file
 */

import './client/Init';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import * as React from 'react';
import ReactDOM from 'react-dom/client';

import { assertDefined } from 'shared/util';
import { mantineTheme } from 'client/ui/theme/mantineTheme';

import { App } from './client/App';

const container = document.getElementById('root');
assertDefined(container);
ReactDOM.createRoot(container).render(
  <MantineProvider theme={mantineTheme} defaultColorScheme="auto">
    <DatesProvider settings={{ locale: 'fi' }}>
      <App />
    </DatesProvider>
  </MantineProvider>,
);
