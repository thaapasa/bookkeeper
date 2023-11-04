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
  app.use(bodyParser.raw({ limit: '10MB', type: 'multipart/form-data' }));
  app.use(bodyParser.raw({}));
  app.use(nocache());

  // Serve assets for dev
  app.get(/\/content\/.*/, (req, res, next) =>
    serveFile(path.join(config.contentPath, req.path), res).catch(next),
  );
  // Serve the index file when reloading page from a /p/xxx subpath
  app.get(/\/p\/.*/, (_, res) => res.sendFile(path.join(config.curDir + '/public/index.html')));

  app.use(traceLogMiddleware());
  app.use('/api', createApi());

  return app;
}

async function serveFile(filepath: string, res: express.Response) {
  const f = Bun.file(filepath);
  if (await f.exists()) {
    res.sendFile(filepath);
  } else {
    res.status(404).send();
  }
}
