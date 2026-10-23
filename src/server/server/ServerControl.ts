import { Server } from 'http';
import { DateTime } from 'luxon';

import { config, redactedConfig } from 'server/Config';
import { shutdownDb } from 'server/data/Db';
import { logger } from 'server/Logger';
import { logError } from 'server/notifications/ErrorLogger';
import { SlackFormatter } from 'server/notifications/SlackFormatter';
import { slackNotifier } from 'server/notifications/SlackNotifier';
import { shutdownTelemetry } from 'server/telemetry/Telemetry';

import revision from '../revision.json';
import { setupFileDirectories } from './FileHandling';
import { setupServer } from './ServerSetup';

let runningServer: Server | undefined = undefined;

function closeRunningServer() {
  const s = runningServer;
  if (!s) return Promise.resolve();
  return new Promise((resolve, reject) =>
    s?.close(err => {
      if (err) reject(err);
      else resolve(undefined);
    }),
  );
}

async function shutdownServer() {
  void slackNotifier.sendNotification(
    `Kukkaro ${config.version} (rev ${config.revision}) running in ${config.host}:${config.port} shutting down...`,
  );

  await closeRunningServer().catch(logError);
  logger.info('Server has shut down');
  await shutdownTelemetry().catch(logError);
  logger.info('Telemetry flushed');
  await shutdownDb().catch(logError);
  logger.info('DB connection closed');

  // TODO: Check why the process does not exist naturally at this point
  process.exit(0);
}

/**
 * The server derives "today" from its local time zone (set with the `TZ`
 * environment variable), so log it to make a wrong setting visible.
 */
function logServerTimeZone() {
  const now = DateTime.local();
  const timeZone = now.zoneName;
  logger.info({ timeZone, now: now.toISO() }, 'Server time zone');
  if (timeZone === 'UTC') {
    logger.warn(
      { timeZone },
      'Server is running in UTC: dates for "today" may be off by a day. Set TZ to the users\' time zone (e.g. TZ=Europe/Helsinki)',
    );
  }
}

export async function startServer() {
  const app = setupServer();
  try {
    await setupFileDirectories();
    runningServer = app.listen(config.port, () => {
      process.on('SIGTERM', shutdownServer);

      logger.info(redactedConfig(), `Server configuration`);
      logServerTimeZone();
      void slackNotifier
        .sendMessage([
          {
            text: `Kukkaro ${config.version} (rev ${config.revision}) started in ${config.host}:${config.port}, env ${config.environment}`,
          },
          ...(revision.commits
            ? [{ text: SlackFormatter.asTitledList('Commits:', revision.commits) }]
            : []),
        ])
        .catch(logError);
    });
  } catch (er) {
    logger.error(er, 'Error in server startup');
  }
}
