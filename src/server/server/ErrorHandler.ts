import debug from 'debug';
import express from 'express';

import { config } from 'server/Config';

const log = debug('bookkeeper:api:error');

const logUserErrors = false;

function isUserError(status: number) {
  return status >= 400 && status < 500;
}

export function createErrorHandler() {
  return (
    err: any,
    req: express.Request,
    res: express.Response,
    _: express.NextFunction
  ) => {
    const status = typeof err.status === 'number' ? err.status : 500;

    log(
      `Error processing ${req.method} ${req.path} -> ${status}: ${err.message}`,
      logUserErrors || !isUserError(status)
        ? JSON.stringify(err, null, 2)
        : err.message
    );
    const data: ErrorInfo = {
      ...(config.showErrorCause ? err : undefined),
      type: 'error',
      code: err.code ? err.code : 'INTERNAL_ERROR',
    };
    res.status(status).json(data);
  };
}

interface ErrorInfo {
  type: 'error';
  code: string;
  cause?: any;
  info?: any;
}
