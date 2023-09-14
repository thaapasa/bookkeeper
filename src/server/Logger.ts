import pino from 'pino';

import { config } from './Config';

export const logger = pino({ level: config.logLevel });
