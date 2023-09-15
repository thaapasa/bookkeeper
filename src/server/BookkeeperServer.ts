import * as bodyParser from 'body-parser';
import express from 'express';
import nocache from 'nocache';
import * as path from 'path';

import { createApi } from './api/Api';
import { config } from './Config';
import { logger } from './Logger';
import { logError } from './notifications/ErrorLogger';
import { slackNotifier } from './notifications/SlackNotifier';

const curDir = process.cwd();
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(nocache());

app.use('/api', createApi());

app.get(/\/p\/.*/, (_, res) => res.sendFile(path.join(curDir + '/public/index.html')));

try {
  app.listen(config.port, () => {
    logger.info(config, `Server configuration`);
    void slackNotifier
      .sendNotification(
        `Kukkaro ${config.version} (rev ${config.revision}) started in ${config.host}:${config.port}, env ${config.environment}`,
      )
      .catch(logError);
  });
} catch (er) {
  logger.error(er, 'Error in server:');
}
