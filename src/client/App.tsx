import * as React from 'react';

import { Session } from 'shared/types';
import { logger } from 'client/Logger';

import { checkLoginState, sessionP } from './data/Login';
import { ErrorView } from './ui/general/ErrorView';
import { LoginPage } from './ui/general/LoginPage';
import { useAsyncData } from './ui/hooks/useAsyncData';
import { useSessionRefreshOnFocus } from './ui/hooks/useSessionRefreshOnFocus';
import { BookkeeperPage } from './ui/layout/BookkeeperPage';

export const App: React.FC = () => {
  const [session, setSession] = React.useState<Session | undefined>(undefined);

  const state = useAsyncData(checkLoginState, true);

  // Refresh session when app returns from background (PWA/mobile app support)
  useSessionRefreshOnFocus(checkLoginState);

  React.useEffect(() => {
    // Logging here so it's only printed once
    logger.info('Initializing bookkeeper client');
    return sessionP.onValue(s => setSession(s ?? undefined));
  }, [setSession]);

  switch (state.type) {
    case 'loaded':
      return session ? <BookkeeperPage session={session} /> : <LoginPage />;
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
