import debug from 'debug';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ITask } from 'pg-promise';
import { z } from 'zod';

import { timeout } from 'shared/time';
import { InvalidGroupError, SessionBasicInfo } from 'shared/types';
import { optNumber } from 'shared/util';
import { SessionDb } from 'server/data/SessionDb';

import { db } from '../data/Db';
import { ServerUtil } from './ServerUtil';
import { validateOr } from './Validation';

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
      log(req.method, req.originalUrl);
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

type ValidatorSpec<R, P, Q, B> = {
  params?: z.ZodType<P, any, any>;
  query?: z.ZodType<Q, any, any>;
  body?: z.ZodType<B, any, any>;
  response?: z.ZodType<R, any, any>;
};

type HandlerParams<P, Q, B> = {
  params: P;
  query: Q;
  body: B;
};

function processValidatedRequest<Return, P, Q, B>(
  spec: ValidatorSpec<Return, P, Q, B>,
  handler: (
    session: SessionBasicInfo,
    data: HandlerParams<P, Q, B>,
    req: Request,
    res: Response
  ) => Promise<Return>,
  groupRequired?: boolean
): RequestHandler {
  return processRequest(async (session, req, res) => {
    const ctx = `${req.method} ${req.originalUrl}`;
    const params = validateOr(
      req.params,
      spec.params,
      {} as P,
      `${ctx} params`
    );
    const body = validateOr(req.body, spec.body, {} as B, `${ctx} body`);
    const query = validateOr(req.query, spec.query, {} as Q, `${ctx} query`);
    const response = await handler(session, { params, query, body }, req, res);
    return validateOr(response, spec.response, response, `${ctx} return value`);
  }, groupRequired);
}

function processValidatedTxRequest<Return, P, Q, B>(
  spec: ValidatorSpec<Return, P, Q, B>,
  handler: (
    tx: ITask<any>,
    session: SessionBasicInfo,
    data: HandlerParams<P, Q, B>,
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
