import pino from 'pino';

import { config } from './Config';
import { instrumentLogger } from './logging/TraceIdProvider';

function lokiTransportTarget(): pino.TransportTargetOptions | undefined {
  const { loki } = config;
  if (!loki.host || !loki.username || !loki.password) {
    return undefined;
  }
  return {
    target: 'pino-loki',
    options: {
      host: loki.host,
      basicAuth: { username: loki.username, password: loki.password },
      labels: { app: config.otel.serviceName, environment: config.otel.environment },
      // Fail fast when Loki is slow/unreachable so the transport worker cannot
      // backpressure pino's thread-stream and stall the main event loop.
      timeout: 3000,
      silenceErrors: true,
    },
  };
}

function createLogger() {
  const lokiTarget = lokiTransportTarget();

  if (!lokiTarget) {
    return pino({ level: config.logLevel });
  }

  // stdout + Loki
  const transport = pino.transport({
    targets: [
      { target: 'pino/file', options: { destination: 1 }, level: config.logLevel },
      lokiTarget,
    ],
  });
  return pino({ level: config.logLevel }, transport);
}

export const logger = instrumentLogger(createLogger());
