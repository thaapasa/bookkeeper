import debug from 'debug';
import * as React from 'react';

import { AnyObject, Session } from 'shared/types';

import { checkLoginState, sessionP } from './data/Login';
import { windowSizeBus } from './data/State';
import { BookkeeperPage } from './ui/general/BookkeeperPage';
import { ErrorView } from './ui/general/ErrorView';
import { LoginPage } from './ui/general/LoginPage';
import { useAsyncData } from './ui/hooks/useAsyncData';
import { useWindowSize } from './ui/hooks/useWindowSize';

const log = debug('bookkeeper:app');

export const App: React.FC<AnyObject> = () => {
  const [session, setSession] = React.useState<Session | undefined>(undefined);

  const windowSize = useWindowSize();
  // Keep global window state bus updated
  windowSizeBus.push(windowSize);

  const state = useAsyncData(checkLoginState, true);

  React.useEffect(() => {
    // Logging here so it's only printed once
    log('Initializing bookkeeper client');
    return sessionP.onValue(s => setSession(s ?? undefined));
  }, []);

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
