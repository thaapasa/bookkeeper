import { Span, SpanStatusCode, trace } from '@opentelemetry/api';
import pgp, { IEventContext } from 'pg-promise';

import { logger } from 'server/Logger';

import { config } from '../Config';

const logSql = process.env.LOG_SQL === 'true';

const sqlLogger = logger.child({ category: 'sql' });

if (logSql) {
  logger.info('Logging all SQL queries');
}

const tracer = trace.getTracer('bookkeeper-db');

/**
 * Map from pg-promise event context to the OTel span for that query.
 * Entries are added in the `query` event and removed in `receive`/`error`.
 */
const activeSpans = new WeakMap<IEventContext, Span>();

function onQuery(e: IEventContext) {
  if (logSql) {
    sqlLogger.info(e.query);
  }

  const parentSpan = trace.getActiveSpan();
  if (!parentSpan) {
    return;
  }

  const queryText = typeof e.query === 'string' ? e.query : e.query?.text;
  const spanName = getSpanName(queryText);

  const span = tracer.startSpan(spanName, {
    attributes: {
      'db.system': 'postgresql',
      'db.statement': queryText ?? undefined,
    },
  });
  activeSpans.set(e, span);
}

function onReceive(e: { data: any[]; ctx: IEventContext }) {
  const span = activeSpans.get(e.ctx);
  if (span) {
    span.setAttribute('db.row_count', e.data?.length ?? 0);
    span.end();
    activeSpans.delete(e.ctx);
  }
}

function onError(err: unknown, e: IEventContext) {
  const span = activeSpans.get(e);
  if (span) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
    span.end();
    activeSpans.delete(e);
  }
}

function getSpanName(query?: string): string {
  if (!query) return 'db.query';
  const first = query.trimStart().split(/[\s(]/, 1)[0]?.toUpperCase();
  switch (first) {
    case 'SELECT':
    case 'INSERT':
    case 'UPDATE':
    case 'DELETE':
    case 'WITH':
      return `db.${first}`;
    default:
      return 'db.query';
  }
}

export const dbMain = pgp({
  query: onQuery,
  receive: onReceive,
  error: onError,
  // Disable JIT for all connections — on small databases JIT compilation
  // overhead far exceeds any execution benefit
  connect: c => c.client.query('SET jit = off'),
});
export const db = dbMain(config.dbUrl);

export async function shutdownDb() {
  await db.$pool.end();
}
