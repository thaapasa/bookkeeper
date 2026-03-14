// OTel must initialize before any instrumented modules (express, pg, pino) are imported
import { initTelemetry } from './telemetry/Telemetry';
initTelemetry();

(async () => {
  const { logger } = await import('./Logger');
  const { startServer } = await import('./server/ServerControl');
  startServer().catch(e => logger.error(e, 'Error in server startup'));
})();
