import express from 'express';

import { config } from 'server/Config';
import { logger } from 'server/Logger';
import { fixDbTraceLeak } from 'server/logging/TraceIdProvider';

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
    `${req.method} ${req.originalUrl} -> HTTP ${status}`,
  );
  const data: ErrorInfo = {
    ...(config.showErrorCause ? err : undefined),
    type: 'error',
    code: err.code ? err.code : 'INTERNAL_ERROR',
  };
  res.status(status).json(data);

  // This call is here to reset the trace id leaking to the global state
  void fixDbTraceLeak();
}

interface ErrorInfo {
  type: 'error';
  code: string;
  cause?: any;
  info?: any;
}
