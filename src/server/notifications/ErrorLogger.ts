import { logger } from 'server/Logger';

export function logError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(err, `Error: ${message}`);
}
