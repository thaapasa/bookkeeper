import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ITask } from 'pg-promise';
import { z } from 'zod';

import { timeout } from 'shared/time';
import { InvalidGroupError, isDefined, SessionBasicInfo, validateOr } from 'shared/types';
import { MaybePromise, optNumber } from 'shared/util';
import { config } from 'server/Config';
import { getSessionByToken } from 'server/data/SessionDb';
import { logger } from 'server/Logger';

import { db } from '../data/Db';
import { ServerUtil } from './ServerUtil';

function processUnauthorizedRequest<T>(
  handler: (req: Request, res: Response) => MaybePromise<T>,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (config.delayRequestsMs) {
        await timeout(config.delayRequestsMs);
      }
      logger.info('%s %s', req.method, req.originalUrl);
      const r = await handler(req, res);
      const status = isDefined(r) ? 200 : 204;
      // Handler succeeded: output response
      ServerUtil.setNoCacheHeaders(res).status(status).json(r);
    } catch (e) {
      // Handler failed: pass error to error handler
      next(e);
    }
  };
}

function processUnauthorizedTxRequest<T>(
  handler: (tx: ITask<any>, req: Request, res: Response) => MaybePromise<T>,
): RequestHandler {
  return processUnauthorizedRequest((req, res) => db.tx(tx => handler(tx, req, res)));
}

function processRequest<T>(
  handler: (session: SessionBasicInfo, req: Request, res: Response) => MaybePromise<T>,
  groupRequired?: boolean,
): RequestHandler {
  return processUnauthorizedRequest(async (req, res) => {
    const token = ServerUtil.getToken(req);
    const session = await db.tx(tx => getSessionByToken(tx, token, optNumber(req.query.groupId)));
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
    res: Response,
  ) => MaybePromise<T>,
  groupRequired?: boolean,
): RequestHandler {
  return processRequest(
    (session, req, res) => db.tx(tx => handler(tx, session, req, res)),
    groupRequired,
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
    res: Response,
  ) => MaybePromise<Return>,
  groupRequired?: boolean,
): RequestHandler {
  return processRequest(async (session, req, res) => {
    const ctx = `${req.method} ${req.originalUrl}`;
    const params = validateOr(req.params, spec.params, {} as P, `${ctx} params`);
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
    res: Response,
  ) => MaybePromise<Return>,
  groupRequired?: boolean,
): RequestHandler {
  return processValidatedRequest(spec, (...p) => db.tx(tx => handler(tx, ...p)), groupRequired);
}

export const Requests = {
  unauthorizedRequest: processUnauthorizedRequest,
  unauthorizedTxRequest: processUnauthorizedTxRequest,
  request: processRequest,
  txRequest: processTxRequest,
  validatedRequest: processValidatedRequest,
  validatedTxRequest: processValidatedTxRequest,
};
