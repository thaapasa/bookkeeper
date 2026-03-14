import { initTelemetry } from './telemetry/Telemetry';
initTelemetry();

import { logger } from './Logger';
import { startServer } from './server/ServerControl';

startServer().catch(e => logger.error(e, 'Error in server startup'));
