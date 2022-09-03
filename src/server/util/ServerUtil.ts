import debug from 'debug';
import { Request, Response } from 'express';
import { ITask } from 'pg-promise';

import { InvalidGroupError, TokenNotPresentError } from 'shared/types/Errors';
import { SessionBasicInfo } from 'shared/types/Session';
import { timeout, toMoment } from 'shared/util/Time';
import { optNumber } from 'shared/util/Util';
import { SessionDb } from 'server/data/SessionDb';

import { config } from '../Config';
import { db } from '../data/Db';

const log = debug('bookkeeper:server');

const requestDelayMs = process.env.DELAY
  ? parseInt(process.env.DELAY, 10)
  : undefined;

interface ErrorInfo {
  type: 'error';
  code: string;
  cause?: any;
  info?: any;
}

const httpDateHeaderPattern = 'ddd, DD MMM YYYY HH:mm:ss';
function setNoCacheHeaders(res: Response): Response {
  res.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate, max-age=0'
  );
  res.set('Pragma', 'no-cache');
  const time = toMoment().utc().format(httpDateHeaderPattern) + ' GMT';
  res.set('Date', time);
  res.set('Expires', time);
  return res;
}

const bearerMatch = /Bearer ([0-9a-zA-Z]*)/;
export function getToken(req: Request): string {
  const tmatch = bearerMatch.exec(req.header('Authorization') || '');
  const token = tmatch && tmatch.length > 0 ? tmatch[1] : undefined;
  if (!token) {
    throw new TokenNotPresentError();
  }
  return token;
}

function handleError(res: Response) {
  return (e: any) => {
    log('Error', e);
    const data: ErrorInfo = {
      ...(config.showErrorCause ? e : undefined),
      type: 'error',
      code: e.code ? e.code : 'INTERNAL_ERROR',
    };
    const status = typeof e.status === 'number' ? e.status : 500;
    res.status(status).json(data);
  };
}

export function processUnauthorizedRequest<T>(
  handler: (req: Request, res: Response) => Promise<T>
) {
  return async (req: Request, res: Response): Promise<void> => {
    log(req.method, req.url);
    try {
      const r = await handler(req, res);
      setNoCacheHeaders(res).json(r);
    } catch (e) {
      handleError(res)(e);
    }
  };
}

export function processUnauthorizedTxRequest<T>(
  handler: (tx: ITask<any>, req: Request, res: Response) => Promise<T>
) {
  return processUnauthorizedRequest((req, res) =>
    db.tx(tx => handler(tx, req, res))
  );
}

export function processRequest<T>(
  handler: (
    session: SessionBasicInfo,
    req: Request,
    res: Response
  ) => Promise<T>,
  groupRequired?: boolean
) {
  return async (req: Request, res: Response) => {
    log(req.method, req.url);
    try {
      const token = getToken(req);
      const session = await db.tx(tx =>
        SessionDb.getSession(tx, token, optNumber(req.query.groupId))
      );
      if (groupRequired && !session.group.id) {
        throw new InvalidGroupError();
      }
      const r = await handler(session, req, res);
      if (requestDelayMs) {
        await timeout(requestDelayMs);
      }
      setNoCacheHeaders(res).json(r);
    } catch (e) {
      handleError(res)(e);
    }
  };
}

export function processTxRequest<T>(
  handler: (
    tx: ITask<any>,
    session: SessionBasicInfo,
    req: Request,
    res: Response
  ) => Promise<T>,
  groupRequired?: boolean
) {
  return processRequest(
    (session, req, res) => db.tx(tx => handler(tx, session, req, res)),
    groupRequired
  );
}
