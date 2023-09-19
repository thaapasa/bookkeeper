import express from 'express';

import { config } from 'server/Config';
import { logger } from 'server/Logger';

const logUserErrors = false;

function isUserError(status: number) {
  return status >= 400 && status < 500;
}

export function createErrorHandler() {
  return (err: any, req: express.Request, res: express.Response, _: express.NextFunction) =>
    processError(err, req, res);
}

export function processError(err: any, req: express.Request, res: express.Response) {
  const status = typeof err.status === 'number' ? err.status : 500;

  const shouldShowError = logUserErrors || !isUserError(status);
  logger.error(
    shouldShowError ? err : { error: err.message },
    `Error processing ${req.method} ${req.path} -> ${status}`,
  );
  const data: ErrorInfo = {
    ...(config.showErrorCause ? err : undefined),
    type: 'error',
    code: err.code ? err.code : 'INTERNAL_ERROR',
  };
  res.status(status).json(data);
}

interface ErrorInfo {
  type: 'error';
  code: string;
  cause?: any;
  info?: any;
}
