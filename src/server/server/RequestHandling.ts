import debug from 'debug';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ITask } from 'pg-promise';
import { z } from 'zod';

import { InvalidGroupError } from 'shared/types/Errors';
import { SessionBasicInfo } from 'shared/types/Session';
import { timeout } from 'shared/util/Time';
import { optNumber } from 'shared/util/Util';
import { SessionDb } from 'server/data/SessionDb';

import { db } from '../data/Db';
import { ServerUtil } from './ServerUtil';
import { validate } from './Validation';

const log = debug('bookkeeper:server');

const requestDelayMs = process.env.DELAY
  ? parseInt(process.env.DELAY, 10)
  : undefined;

function processUnauthorizedRequest<T>(
  handler: (req: Request, res: Response) => Promise<T>
): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (requestDelayMs) {
        await timeout(requestDelayMs);
      }
      log(req.method, req.url);
      const r = await handler(req, res);
      // Handler succeeded: output response
      ServerUtil.setNoCacheHeaders(res).json(r);
    } catch (e) {
      // Handler failed: pass error to error handler
      next(e);
    }
  };
}

function processUnauthorizedTxRequest<T>(
  handler: (tx: ITask<any>, req: Request, res: Response) => Promise<T>
): RequestHandler {
  return processUnauthorizedRequest((req, res) =>
    db.tx(tx => handler(tx, req, res))
  );
}

function processRequest<T>(
  handler: (
    session: SessionBasicInfo,
    req: Request,
    res: Response
  ) => Promise<T>,
  groupRequired?: boolean
): RequestHandler {
  return processUnauthorizedRequest(async (req, res) => {
    const token = ServerUtil.getToken(req);
    const session = await db.tx(tx =>
      SessionDb.getSession(tx, token, optNumber(req.query.groupId))
    );
    if (groupRequired && !session.group.id) {
      throw new InvalidGroupError();
    }
    return await handler(session, req, res);
  });
}

function processTxRequest<T>(
  handler: (
    tx: ITask<any>,
    session: SessionBasicInfo,
    req: Request,
    res: Response
  ) => Promise<T>,
  groupRequired?: boolean
): RequestHandler {
  return processRequest(
    (session, req, res) => db.tx(tx => handler(tx, session, req, res)),
    groupRequired
  );
}

function processValidatedRequest<Params, Body, Return>(
  spec: {
    params?: z.ZodType<Params>;
    body?: z.ZodType<Body>;
  },
  handler: (
    session: SessionBasicInfo,
    data: {
      params: Params;
      body: Body;
    },
    req: Request,
    res: Response
  ) => Promise<Return>,
  groupRequired?: boolean
): RequestHandler {
  return processRequest((session, req, res) => {
    const params = spec.params
      ? validate(req.params, spec.params)
      : ({} as Params);
    const body = spec.body ? validate(req.body, spec.body) : ({} as Body);
    return handler(session, { params, body }, req, res);
  }, groupRequired);
}

function processValidatedTxRequest<Params, Body, Return>(
  spec: {
    params?: z.ZodType<Params>;
    body?: z.ZodType<Body>;
  },
  handler: (
    tx: ITask<any>,
    session: SessionBasicInfo,
    data: {
      params: Params;
      body: Body;
    },
    req: Request,
    res: Response
  ) => Promise<Return>,
  groupRequired?: boolean
): RequestHandler {
  return processValidatedRequest(
    spec,
    (...p) => db.tx(tx => handler(tx, ...p)),
    groupRequired
  );
}

export const Requests = {
  unauthorizedRequest: processUnauthorizedRequest,
  unauthorizedTxRequest: processUnauthorizedTxRequest,
  request: processRequest,
  txRequest: processTxRequest,
  validatedRequest: processValidatedRequest,
  validatedTxRequest: processValidatedTxRequest,
};
