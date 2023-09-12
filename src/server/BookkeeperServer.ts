import * as bodyParser from 'body-parser';
import debug from 'debug';
import express from 'express';
import * as path from 'path';

import { createApi } from './api/Api';
import { config } from './Config';

const log = debug('bookkeeper:server');

const curDir = process.cwd();
const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api', createApi());

app.get(/\/p\/.*/, (_, res) => res.sendFile(path.join(curDir + '/public/index.html')));

try {
  app.listen(config.port, () => {
    log(
      `Kukkaro server ${config.version} (revision ${config.revision}) started in port ${config.port} with configuration`,
      config,
    );
  });
} catch (er) {
  log('Error in server:', er);
}
