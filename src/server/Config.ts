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
  refreshTokenTimeout: process.env.REFRESH_TOKEN_TIMEOUT || '2 weeks',
  logLevel: process.env.LOG_LEVEL || 'info',
  showErrorCause: process.env.SHOW_ERROR_CAUSE === 'true',
  sessionTimeout: process.env.SESSION_TIMEOUT || '20 minutes',
  dbUrl: process.env.DB_URL || 'postgresql://postgres:postgres@localhost/postgres',
  dbSSL: process.env.DB_SSL === 'true',
  webhookUrl: process.env.SLACK_WEBHOOK_URL as string | undefined,

  logRequestId: process.env.LOG_REQUEST_ID !== 'false',
  delayRequestsMs: process.env.DELAY ? parseInt(process.env.DELAY, 10) : undefined,

  curDir,
  fileUploadPath: path.join(curDir, process.env.UPLOAD_PATH || './uploads'),
  contentPath: path.join(curDir, process.env.CONTENT_PATH || './content'),
  useNodeFileAPI: process.env.USE_NODE_FILE_API === 'true',
};
