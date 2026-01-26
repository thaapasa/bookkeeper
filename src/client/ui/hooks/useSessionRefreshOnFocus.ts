import * as React from 'react';

import { logger } from 'client/Logger';

/**
 * Refreshes the session when the app returns from background.
 *
 * This is particularly useful for PWA/mobile/desktop app installs where the app
 * may be restored from background without a full page reload. The session token
 * may have expired while the app was in the background.
 *
 * Uses the `visibilitychange` event which fires when:
 * - A PWA/mobile app is brought back to foreground
 * - A browser tab becomes visible again
 * - The device is unlocked
 */
export function useSessionRefreshOnFocus(refreshSession: () => Promise<boolean>): void {
  // Track if we've been hidden at least once to avoid refreshing on initial load
  const wasHiddenRef = React.useRef(false);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
        return;
      }

      // Only refresh if we were previously hidden
      if (document.visibilityState === 'visible' && wasHiddenRef.current) {
        logger.info('App became visible after being hidden, refreshing session');
        refreshSession().catch(err => {
          logger.warn(err, 'Session refresh on visibility change failed');
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshSession]);
}
