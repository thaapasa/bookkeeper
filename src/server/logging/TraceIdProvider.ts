import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Logger } from 'pino';

import { nextRequestId } from 'shared/util';
import { config } from 'server/Config';

export const traceIdStorage = new AsyncLocalStorage();

export function getCurrentTraceId() {
  const s = traceIdStorage.getStore() as string | undefined;
  return s ?? undefined;
}

export async function initTraceContext<T>(func: () => T | Promise<T>): Promise<T> {
  // Initialize new local context
  const traceId = nextRequestId();
  return await traceIdStorage.run(traceId, func);
}

export function traceLogMiddleware() {
  return (_req: Request, _res: Response, next: NextFunction) => initTraceContext(next);
}

const LogMethods = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] satisfies (keyof Logger)[];
type LogMethod = (typeof LogMethods)[number];

/**
 * Instruments the Pino logger to automatically grab the request id from
 * the AsyncLocalStorage and add it to the log output.
 */
export function instrumentLogger(logger: Logger): Logger {
  if (!config.logRequestId) {
    return logger;
  }
  // Replace each logger method an instrumented version
  LogMethods.forEach(m => transformLogFn(logger, m));

  // Auto-instrument all child loggers
  const orgChild = logger.child;
  logger.child = (bindings, options) => {
    const childLogger = orgChild.call(logger, bindings, options);
    return instrumentLogger(childLogger) as any;
  };
  return logger;
}

function transformLogFn(logger: Logger, method: LogMethod) {
  const orgImpl = logger[method];
  logger[method] = (...args: any[]) => {
    const traceId = getCurrentTraceId();
    if (traceId) {
      // Only change arguments when the requestId is defined
      if (typeof args[0] === 'object' && args[0] && args[0].traceId === undefined) {
        // First argument is the logging object; so add request id to it
        args[0].traceId = traceId;
      } else if (typeof args[0] === 'string') {
        // First argument is the log format string, so add a new logging object
        // with the request id
        args.unshift({ traceId });
      }
    }
    // Call original method
    return orgImpl.apply(logger, args as any);
  };
}
