import { Span, SpanStatusCode, trace } from '@opentelemetry/api';
import type { IEventContext, ITask } from 'pg-promise';
import pgPromise from 'pg-promise';

import { logger } from 'server/Logger';

import { config } from '../Config';

// Configure pg type parsers before creating the pg-promise instance.
// pg-promise re-exports the underlying pg driver, so we instantiate once
// just to access pg.types, then create the real instance with init options below.
const pgTypes = pgPromise().pg.types;

// PostgreSQL type OIDs
const PG_DATE = 1082;
const PG_TIMESTAMP = 1114;
const PG_TIMESTAMPTZ = 1184;

// DATE → return as ISODate string (already "2026-03-31")
pgTypes.setTypeParser(PG_DATE, (val: string) => val);

// TIMESTAMP (without timezone) → reject; all timestamps should have timezone info
pgTypes.setTypeParser(PG_TIMESTAMP, (val: string) => {
  throw new Error(
    `Received TIMESTAMP without timezone from PostgreSQL: "${val}". Use TIMESTAMPTZ instead.`,
  );
});

// TIMESTAMPTZ → keep as string for now (will be converted to ISOTimestamp in a follow-up)
pgTypes.setTypeParser(PG_TIMESTAMPTZ, (val: string) => val);

export type DbTask = ITask<object>;

const logSql = process.env.LOG_SQL === 'true';

const sqlLogger = logger.child({ category: 'sql' });

if (logSql) {
  logger.info('Logging all SQL queries');
}

const tracer = trace.getTracer('bookkeeper-db');

/**
 * Map from pg Client instance to the OTel span for the in-flight query.
 *
 * pg-promise's getContext() creates a new wrapper object for each event
 * (query, receive, error), so we can't use it as a WeakMap key. However,
 * the `client` field points to the same pg Client instance across events
 * for a given query. Within a task/transaction queries are sequential on
 * one connection; outside a task each query gets its own pooled connection.
 * So `client` uniquely identifies the in-flight query.
 */
const activeSpans = new WeakMap<object, Span>();

function onQuery(e: IEventContext) {
  const queryText = typeof e.query === 'string' ? e.query : e.query?.text;

  if (logSql) {
    sqlLogger.info(queryText);
  }

  if (!trace.getActiveSpan() || !e.client) {
    return;
  }

  const span = tracer.startSpan(getSpanName(queryText), {
    attributes: {
      'db.system': 'postgresql',
      'db.statement': queryText ?? undefined,
    },
  });
  activeSpans.set(e.client, span);
}

function onReceive(e: { data: any[]; ctx: IEventContext }) {
  const client = e.ctx?.client;
  const span = client ? activeSpans.get(client) : undefined;
  if (span) {
    span.setAttribute('db.row_count', e.data?.length ?? 0);
    span.end();
    activeSpans.delete(client);
  }
}

function onError(err: unknown, e: IEventContext) {
  const client = e?.client;
  const span = client ? activeSpans.get(client) : undefined;
  if (span) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
    span.end();
    activeSpans.delete(client);
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

export const dbMain = pgPromise({
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
