import { logger } from 'client/Logger';

// A home screen app resumes from memory instead of reloading, so it can run an
// old version long after a deploy. Check for a new version each time the app
// comes back to the foreground, and reload if there is one.

async function reloadIfOutdated() {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { buildId } = (await res.json()) as { buildId?: string };
    if (buildId && buildId !== __BUILD_ID__) {
      logger.info({ buildId, runningBuildId: __BUILD_ID__ }, 'New version deployed, reloading');
      location.reload();
    }
  } catch {
    // Offline or a bad response: try again on the next resume.
  }
}

if (import.meta.env.PROD) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void reloadIfOutdated();
  });
}
