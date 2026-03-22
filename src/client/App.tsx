import * as React from 'react';

import { Session } from 'shared/types';
import { logger } from 'client/Logger';

import { checkLoginState, sessionP } from './data/Login';
import { windowSizeBus } from './data/State';
import { ErrorView } from './ui/general/ErrorView';
import { LoginPage } from './ui/general/LoginPage';
import { useAsyncData } from './ui/hooks/useAsyncData';
import { useSessionRefreshOnFocus } from './ui/hooks/useSessionRefreshOnFocus';
import { useWindowSize } from './ui/hooks/useWindowSize';
import { BookkeeperPage } from './ui/layout/BookkeeperPage.tsx';

export const App: React.FC = () => {
  const [session, setSession] = React.useState<Session | undefined>(undefined);

  const windowSize = useWindowSize();

  // Keep global window state bus updated (must be in useEffect to avoid setState during render)
  React.useEffect(() => {
    windowSizeBus.push(windowSize);
  }, [windowSize]);

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
      return session ? <BookkeeperPage session={session} windowSize={windowSize} /> : <LoginPage />;
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
