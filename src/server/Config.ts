import * as dotenv from 'dotenv';
import { hostname } from 'os';
dotenv.config();

const env = process.env.NODE_ENV || 'development';

import path from 'path';

import revision from './revision';
const port = process.env.SERVER_PORT;

const curDir = process.cwd();
class Config {
  public environment = env;

  public version = revision.version;
  public commitId = revision.commitId;
  public revision = revision.commitId.substring(0, 8);

  public host = hostname();
  public port = port ? parseInt(port, 10) : 3100;
  public refreshTokenTimeout = process.env.REFRESH_TOKEN_TIMEOUT || '2 weeks';
  public logLevel = process.env.LOG_LEVEL || 'info';
  public showErrorCause: boolean = process.env.SHOW_ERROR_CAUSE === 'true';
  public sessionTimeout = process.env.SESSION_TIMEOUT || '20 minutes';
  public dbUrl = process.env.DB_URL || 'postgresql://postgres:postgres@localhost/postgres';
  public dbSSL: boolean = process.env.DB_SSL === 'true';
  public webhookUrl: string | undefined = process.env.SLACK_WEBHOOK_URL;

  public logRequestId: boolean = process.env.LOG_REQUEST_ID !== 'false';
  public delayRequestsMs: number | undefined = process.env.DELAY
    ? parseInt(process.env.DELAY, 10)
    : undefined;

  public curDir = curDir;
  public fileUploadPath: string = path.join(curDir, process.env.UPLOAD_PATH || './uploads');
  public assetPath: string = path.join(curDir, process.env.ASSET_PATH || './assets');
}

export const config = new Config();
