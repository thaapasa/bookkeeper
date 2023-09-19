import pino from 'pino';

import { config } from './Config';
import { instrumentLogger } from './logging/TraceIdProvider';

function debugLogger() {
  return pino({ level: config.logLevel });
}

function prodLogger() {
  const transport = pino.transport({
    target: 'pino/file',
    options: { destination: 'log/server.log', append: false },
  });
  return pino(transport);
}

export const logger = instrumentLogger(
  config.environment === 'development' ? debugLogger() : prodLogger(),
);
