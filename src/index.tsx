/*
 * This is Bookkeeper client (web app) index file
 */

import { Settings } from 'luxon';

Settings.defaultLocale = 'fi';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import * as React from 'react';
import ReactDOM from 'react-dom/client';

import { assertDefined } from 'shared/util';
import { cssVariablesResolver, mantineTheme } from 'client/ui/theme/mantineTheme';

import { App } from './client/App';

const container = document.getElementById('root');
assertDefined(container);
ReactDOM.createRoot(container).render(
  <MantineProvider
    theme={mantineTheme}
    defaultColorScheme="auto"
    cssVariablesResolver={cssVariablesResolver}
  >
    <DatesProvider settings={{ locale: 'fi' }}>
      <App />
    </DatesProvider>
  </MantineProvider>,
);
