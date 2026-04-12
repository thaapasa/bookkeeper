import express from 'express';
import nocache from 'nocache';
import * as path from 'path';

import { createApi } from 'server/api/Api';
import { config } from 'server/Config';
import { traceLogMiddleware } from 'server/logging/TraceIdProvider';
import { setOtelRouteInfo } from 'server/telemetry/OtelRoute';

export function setupServer() {
  const app = express();

  // Vite writes content-hashed filenames under /assets — cache forever.
  app.use(
    '/assets',
    express.static(path.join(config.staticPath, 'assets'), {
      immutable: true,
      maxAge: '1y',
    }),
  );
  // Other static files (favicons, manifest, etc.) — short cache.
  // index.html is served explicitly below so it never gets cached.
  app.use(express.static(config.staticPath, { maxAge: '1h', index: false }));

  // Express 5 has built-in body parsing
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.raw({ limit: '10MB', type: 'multipart/form-data' }));
  app.use(express.raw({}));

  // Serve user-uploaded content (images etc.) — filenames are random 24-char IDs
  // generated on upload, so files at a given path never change. Cache forever on hit;
  // 404s are left uncached so a later upload to the same path is visible.
  app.get(/\/content\/.*/, (req, res, next) => {
    setOtelRouteInfo(req, '/content/:path');
    return serveFile(path.join(config.contentPath, req.path), res, {
      cacheControl: 'public, max-age=31536000, immutable',
    }).catch(next);
  });

  // SPA entry point and reloads of /p/xxx subpaths — always fresh.
  app.get('/', nocache(), (_req, res) => {
    res.sendFile(path.join(config.staticPath, 'index.html'));
  });
  app.get(/\/p\/.*/, nocache(), (req, res) => {
    setOtelRouteInfo(req, '/p/:path');
    res.sendFile(path.join(config.staticPath, 'index.html'));
  });

  app.use(traceLogMiddleware());
  app.use('/api', nocache(), createApi());

  return app;
}

async function serveFile(
  filepath: string,
  res: express.Response,
  opts: { cacheControl?: string } = {},
) {
  const f = Bun.file(filepath);
  if (await f.exists()) {
    if (opts.cacheControl) {
      res.set('Cache-Control', opts.cacheControl);
    }
    res.sendFile(filepath);
  } else {
    res.status(404).send();
  }
}
