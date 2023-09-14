import pino from 'pino';

import { config } from './Config';

function debugLogger() {
  return pino({ level: config.logLevel });
}

function prodLogger() {
  const transport = pino.transport({
    target: 'pino/file',
    options: { destination: 'log/server.log' },
  });
  return pino(transport);
}

export const logger = config.environment === 'development' ? debugLogger() : prodLogger();
