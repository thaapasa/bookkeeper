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
    },
  };
}

function createLogger() {
  const lokiTarget = lokiTransportTarget();

  if (config.environment === 'development') {
    if (!lokiTarget) {
      return pino({ level: config.logLevel });
    }
    // Dev: stdout (default) + Loki
    const transport = pino.transport({
      targets: [
        { target: 'pino/file', options: { destination: 1 }, level: config.logLevel },
        lokiTarget,
      ],
    });
    return pino({ level: config.logLevel }, transport);
  }

  // Production: file + optionally Loki
  const targets: pino.TransportTargetOptions[] = [
    { target: 'pino/file', options: { destination: 'log/server.log', append: false } },
  ];
  if (lokiTarget) {
    targets.push(lokiTarget);
  }
  const transport = pino.transport({ targets });
  return pino({ level: config.logLevel }, transport);
}

export const logger = instrumentLogger(createLogger());
