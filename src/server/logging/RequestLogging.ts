import { AsyncLocalStorage } from 'node:async_hooks';
import { Logger } from 'pino';

import { nextRequestId } from 'shared/util';
import { config } from 'server/Config';

const asyncStorage = new AsyncLocalStorage();

interface LocalState {
  requestId: string;
}

export function getCurrentRequestId() {
  const s = asyncStorage.getStore() as LocalState | undefined;
  return s?.requestId ?? undefined;
}

export function newLocalContext<T>(func: () => Promise<T>) {
  if (getCurrentRequestId()) {
    // Already in a request context
    return func();
  }

  // Initialize new local context
  const nextState: LocalState = {
    requestId: nextRequestId(),
  };
  return asyncStorage.run(nextState, func);
}

const LogMethods = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] satisfies (keyof Logger)[];
type LogMethod = (typeof LogMethods)[number];

function transformLogFn(logger: Logger, method: LogMethod) {
  const orgImpl = logger[method];
  logger[method] = (...args: any[]) => {
    const requestId = getCurrentRequestId();
    if (requestId) {
      // Only change arguments when the requestId is defined
      if (typeof args[0] === 'object' && args[0] && args[0].requestId === undefined) {
        // First argument is the logging object; so add request id to it
        args[0].requestId = requestId;
      } else if (typeof args[0] === 'string') {
        // First argument is the log format string, so add a new logging object
        // with the request id
        args.unshift({ requestId });
      }
    }
    // Call original method
    return orgImpl.apply(logger, args as any);
  };
}

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
