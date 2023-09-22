import * as bodyParser from 'body-parser';
import express from 'express';
import nocache from 'nocache';
import * as path from 'path';

import { createApi } from 'server/api/Api';
import { config } from 'server/Config';
import { traceLogMiddleware } from 'server/logging/TraceIdProvider';

export function setupServer() {
  const app = express();
  app.use(express.static('public'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(bodyParser.raw({ limit: '10MB' }));
  app.use(nocache());

  app.use(traceLogMiddleware());
  app.use('/api', createApi());

  app.get(/\/p\/.*/, (_, res) => res.sendFile(path.join(config.curDir + '/public/index.html')));

  return app;
}
