/*
 * This is Bookkeeper client (web app) index file
 */

import { Settings } from 'luxon';

Settings.defaultLocale = 'fi';

import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
import 'client/css/bookkeeper.css';

import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import ReactDOM from 'react-dom/client';

import { assertDefined } from 'shared/util';
import { queryClient } from 'client/data/query';
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
    <Notifications position="bottom-center" autoClose={5000} />
    <DatesProvider settings={{ locale: 'fi' }}>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </DatesProvider>
  </MantineProvider>,
);
