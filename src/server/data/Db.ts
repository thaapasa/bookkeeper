import pgp from 'pg-promise';
import { config } from '../Config';
import debug from 'debug';
const log = debug('bookkeeper:sql');

const logSql = process.env.LOG_SQL === 'true';

if (logSql) {
  log('Logging all SQL queries');
}

export const db = pgp({
  query: logSql ? q => log(`SQL: ${q.query}`) : undefined,
})(config.dbUrl);
