import * as React from 'react';

import { logger } from 'client/Logger';

import { checkLoginState } from './data/Login';
import { useSessionStatus, useSessionStore } from './data/SessionStore';
import { ErrorView } from './ui/general/ErrorView';
import { LoginPage } from './ui/general/LoginPage';
import { useSessionRefreshOnFocus } from './ui/hooks/useSessionRefreshOnFocus';
import { BookkeeperPage } from './ui/layout/BookkeeperPage';

export const App: React.FC = () => {
  const session = useSessionStore(s => s.session);
  const status = useSessionStatus();

  React.useEffect(() => {
    logger.info('Initializing bookkeeper client');
    void checkLoginState();
  }, []);

  // Refresh session when app returns from background (PWA/mobile app support)
  useSessionRefreshOnFocus(checkLoginState);

  // Keep the app mounted during background refreshes so in-progress UI state
  // (e.g. a half-filled expense dialog) survives a tab switch.
  if (session) {
    return <BookkeeperPage session={session} />;
  }

  switch (status) {
    case 'ready':
      return <LoginPage />;
    case 'error':
      return (
        <ErrorView title="Hups">
          Kirjautumistietoja ei saatu ladattua. Koita ladata sivu uusiksi!
        </ErrorView>
      );
    default:
      return null;
  }
};
