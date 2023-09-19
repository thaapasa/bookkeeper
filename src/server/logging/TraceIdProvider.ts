import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Logger } from 'pino';

import { BkError } from 'shared/types';
import { nextRequestId } from 'shared/util';
import { config } from 'server/Config';
import { db } from 'server/data/Db';

export const traceIdStorage = new AsyncLocalStorage();

const INIT_TRACEID = 'INIT-TRACE';

interface TraceState {
  startTime: number;
  traceId: string;
}

export function getCurrentTraceState() {
  const s = traceIdStorage.getStore() as TraceState | undefined;
  // Check for magic value (see `fixDbTraceLeak()`)
  return s && s.traceId && s.traceId !== INIT_TRACEID ? s : undefined;
}

export async function initTraceContext<T>(func: () => T | Promise<T>): Promise<T> {
  // Initialize new local context
  const state: TraceState = {
    traceId: nextRequestId(),
    startTime: new Date().getTime(),
  };
  return await traceIdStorage.run(state, func);
}

export function traceLogMiddleware() {
  return (_req: Request, _res: Response, next: NextFunction) => initTraceContext(next);
}

/**
 * There seems to be a bug somewhere in the Bun.sh implementation of the AsyncLocalStorage.
 * When a `db.tx` function (from `pg-promise`) throws an error, the current local storage
 * state from the async callback chain leaks into a "global state", so it's actually
 * returned when `traceIdStorage.getStore()` is called from outside any actually tracked
 * async callback chain.
 *
 * This hack is here to put in a magic value to the global state (using the buggy mechanism)
 * so we can recognize it and filter it out.
 *
 * The caveat is that this needs to be call every time after DB transactions are rolled back
 * anywhere in an async callback that is traced using this AsyncLocaLStorage, because those
 * overwrite the "global state value" with the data used for that thread.'
 *
 * This means that some unrelated logging entries that happen outside of the request chain
 * may incorrectly be tagged with the trace id of that request chain, if they occur at the
 * same time an error happens in that request processing (and they are not part of another
 * request chain themselves). This should be rare though.
 */
export async function fixDbTraceLeak() {
  try {
    await traceIdStorage.run(
      { traceId: INIT_TRACEID, startTime: new Date().getTime() },
      async () =>
        await db.task(() => {
          throw new BkError(
            'INIT_GLOBAL_TRACE_ID',
            'This is a hack to leak a known value into the storage that is seen from outside async callbacks',
            500,
          );
        }),
    );
  } catch (e) {
    // Ignore
  }
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
    const state = getCurrentTraceState();
    if (state) {
      const timeFromStart = new Date().getTime() - state.startTime;
      // Only change arguments when the requestId is defined
      if (typeof args[0] === 'object' && args[0] && args[0].traceId === undefined) {
        // First argument is the logging object; so add request id to it
        args[0].traceId = state.traceId;
        args[0].timeMs = timeFromStart;
      } else if (typeof args[0] === 'string') {
        // First argument is the log format string, so add a new logging object
        // with the request id
        args.unshift({ traceId: state.traceId, timeMs: timeFromStart });
      }
    }
    // Call original method
    return orgImpl.apply(logger, args as any);
  };
}
