import debug from 'debug';
import express from 'express';

import { config } from 'server/Config';

const log = debug('bookkeeper:server');

export function createErrorHandler() {
  return (
    err: any,
    req: express.Request,
    res: express.Response,
    _: express.NextFunction
  ) => {
    log(`Error processing ${req.method} ${req.path}`, err);
    const data: ErrorInfo = {
      ...(config.showErrorCause ? err : undefined),
      type: 'error',
      code: err.code ? err.code : 'INTERNAL_ERROR',
    };
    const status = typeof err.status === 'number' ? err.status : 500;
    res.status(status).json(data);
  };
}

interface ErrorInfo {
  type: 'error';
  code: string;
  cause?: any;
  info?: any;
}
