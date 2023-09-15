import { logger } from 'server/Logger';

export function logError(err: any) {
  logger.error(err, `Error: ${err?.message}`);
}
