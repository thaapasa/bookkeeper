import express from 'express';
import nocache from 'nocache';
import * as path from 'path';

import { createApi } from 'server/api/Api';
import { config } from 'server/Config';
import { traceLogMiddleware } from 'server/logging/TraceIdProvider';
import { setOtelRouteInfo } from 'server/telemetry/OtelRoute';

export function setupServer() {
  const app = express();
  app.use(express.static('public'));
  // Express 5 has built-in body parsing
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.raw({ limit: '10MB', type: 'multipart/form-data' }));
  app.use(express.raw({}));
  app.use(nocache());

  // Serve assets for dev
  app.get(/\/content\/.*/, (req, res, next) => {
    setOtelRouteInfo(req, '/content/:path');
    return serveFile(path.join(config.contentPath, req.path), res).catch(next);
  });
  // Serve the index file when reloading page from a /p/xxx subpath
  app.get(/\/p\/.*/, (req, res) => {
    setOtelRouteInfo(req, '/p/:path');
    res.sendFile(path.join(config.curDir + '/public/index.html'));
  });

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
