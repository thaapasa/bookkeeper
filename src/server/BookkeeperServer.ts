import { Server } from 'http';

import { config } from './Config';
import { shutdownDb } from './data/Db';
import { logger } from './Logger';
import { fixDbTraceLeak } from './logging/TraceIdProvider';
import { logError } from './notifications/ErrorLogger';
import { slackNotifier } from './notifications/SlackNotifier';
import { setupServer } from './server/ServerSetup';

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

try {
  void fixDbTraceLeak();
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
