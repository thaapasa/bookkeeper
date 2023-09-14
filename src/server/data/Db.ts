import pgp from 'pg-promise';

import { logger } from 'server/Logger';

import { config } from '../Config';

const logSql = process.env.LOG_SQL === 'true';

const sqlLogger = logger.child({ category: 'sql' });

if (logSql) {
  logger.info('Logging all SQL queries');
}

export const db = pgp({
  query: logSql ? q => sqlLogger.info(q.query) : undefined,
})(config.dbUrl);
