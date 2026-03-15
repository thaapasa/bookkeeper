import pgp from 'pg-promise';

import { logger } from 'server/Logger';

import { config } from '../Config';

const logSql = process.env.LOG_SQL === 'true';

const sqlLogger = logger.child({ category: 'sql' });

if (logSql) {
  logger.info('Logging all SQL queries');
}

export const dbMain = pgp({
  query: logSql ? q => sqlLogger.info(q.query) : undefined,
  // Disable JIT for all connections — on small databases JIT compilation
  // overhead far exceeds any execution benefit
  connect: c => c.client.query('SET jit = off'),
});
export const db = dbMain(config.dbUrl);

export async function shutdownDb() {
  await db.$pool.end();
}
