import { Server } from 'http';

import { config } from 'server/Config';
import { shutdownDb } from 'server/data/Db';
import { logger } from 'server/Logger';
import { fixDbTraceLeak } from 'server/logging/TraceIdFix';
import { logError } from 'server/notifications/ErrorLogger';
import { slackNotifier } from 'server/notifications/SlackNotifier';

import { setupFileDirectories } from './FileHandling';
import { setupServer } from './ServerSetup';

const app = setupServer();

let runningServer: Server | undefined = undefined;

function closeRunningServer() {
  const s = runningServer;
  if (!s) return Promise.resolve();
  return new Promise(
    (resolve, reject) =>
      s?.close(err => {
        if (err) reject(err);
        else resolve(err);
      }),
  );
}

async function shutdownServer() {
  void slackNotifier.sendNotification(
    `Kukkaro ${config.version} (rev ${config.revision}) running in ${config.host}:${config.port} shutting down...`,
  );

  await closeRunningServer().catch(logError);
  logger.info('Server has shut down');
  await shutdownDb().catch(logError);
  logger.info('DB connection closed');

  // TODO: Check why the process does not exist naturally at this point
  process.exit(0);
}

export async function startServer() {
  try {
    await fixDbTraceLeak();
    await setupFileDirectories();
    runningServer = app.listen(config.port, () => {
      process.on('SIGTERM', shutdownServer);

      logger.info(config, `Server configuration`);
      void slackNotifier
        .sendNotification(
          `Kukkaro ${config.version} (rev ${config.revision}) started in ${config.host}:${config.port}, env ${config.environment}`,
        )
        .catch(logError);
    });
  } catch (er) {
    logger.error(er, 'Error in server startup');
  }
}