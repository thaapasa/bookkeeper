import express from 'express';

import { config } from 'server/Config';
import { logger } from 'server/Logger';

const logUserErrors = false;

function isUserError(status: number) {
  return status >= 400 && status < 500;
}

export function createErrorHandler() {
  return (err: unknown, req: express.Request, res: express.Response, _: express.NextFunction) =>
    processError(err, req, res);
}

export function processError(err: unknown, req: express.Request, res: express.Response) {
  const e = err as Record<string, unknown> | undefined;
  const status = typeof e?.status === 'number' ? e.status : 500;

  const shouldShowError = logUserErrors || !isUserError(status);
  logger.error(
    shouldShowError ? err : { error: e?.message },
    `${req.method} ${req.originalUrl} -> HTTP ${status}`,
  );
  const data: ErrorInfo = {
    ...(config.showErrorCause ? (e as unknown as ErrorInfo) : undefined),
    type: 'error',
    code: typeof e?.code === 'string' ? e.code : 'INTERNAL_ERROR',
  };
  res.status(status).json(data);
}

interface ErrorInfo {
  type: 'error';
  code: string;
  cause?: unknown;
  info?: unknown;
}
