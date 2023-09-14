import * as bodyParser from 'body-parser';
import express from 'express';
import nocache from 'nocache';
import * as path from 'path';

import { createApi } from './api/Api';
import { config } from './Config';
import { logger } from './Logger';

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
    logger.info(
      config,
      `Kukkaro server ${config.version} (revision ${config.revision}) started in port ${config.port}`,
    );
  });
} catch (er) {
  logger.error(er, 'Error in server:');
}
