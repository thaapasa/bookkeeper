import * as dotenv from 'dotenv';
import { hostname } from 'os';
import path from 'path';

import revision from './revision.json';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const port = process.env.SERVER_PORT;
const curDir = process.cwd();

export const config = {
  environment: env,

  version: revision.version,
  commitId: revision.commitId,
  revision: revision.commitId.substring(0, 8),
  commitMessage: revision.message,
  bunVersion: Bun.version,

  host: hostname(),
  port: port ? parseInt(port, 10) : 3100,
  refreshTokenTimeout: process.env.REFRESH_TOKEN_TIMEOUT || '1 month',
  logLevel: process.env.LOG_LEVEL || 'info',
  showErrorCause: process.env.SHOW_ERROR_CAUSE === 'true',
  sessionTimeout: process.env.SESSION_TIMEOUT || '30 minutes',
  dbUrl: process.env.DB_URL || 'postgresql://postgres:postgres@localhost/postgres',
  dbSSL: process.env.DB_SSL === 'true',
  webhookUrl: process.env.SLACK_WEBHOOK_URL as string | undefined,

  logRequestId: process.env.LOG_REQUEST_ID !== 'false',
  delayRequestsMs: process.env.DELAY ? parseInt(process.env.DELAY, 10) : undefined,

  curDir,
  fileUploadPath: path.join(curDir, process.env.UPLOAD_PATH || './uploads'),
  contentPath: path.join(curDir, process.env.CONTENT_PATH || './content'),
  useNodeFileAPI: process.env.USE_NODE_FILE_API === 'true',

  // OpenTelemetry (optional — telemetry disabled when endpoint is not set)
  otel: {
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT as string | undefined,
    environment: process.env.OTEL_ENVIRONMENT || env,
    serviceName: process.env.OTEL_SERVICE_NAME || 'bookkeeper',
  },

  // Grafana Loki log shipping (optional — logs only go to local target when not set)
  loki: {
    host: process.env.GRAFANA_LOKI_HOST as string | undefined,
    username: process.env.GRAFANA_LOKI_USERNAME as string | undefined,
    password: process.env.GRAFANA_LOKI_PASSWORD as string | undefined,
  },
};
