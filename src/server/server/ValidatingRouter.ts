import { Request, RequestHandler, Response, Router } from 'express';
import { ITask } from 'pg-promise';
import { z } from 'zod';

import { isDefined, ObjectIdString, SessionBasicInfo } from 'shared/types';
import { MaybePromise, recordFromPairs } from 'shared/util';

import { Requests } from './RequestHandling';

export const RouteMethods = ['all', 'get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;
export type RouteMethod = typeof RouteMethods[number];

const TypeMap = {
  id: ObjectIdString,
  userId: ObjectIdString,
  sourceId: ObjectIdString,
  categoryId: ObjectIdString,
  expenseId: ObjectIdString,
  reportId: ObjectIdString,
  recurringExpenseId: ObjectIdString,
};
type TypeMap = typeof TypeMap;
type KnownParamNames = keyof typeof TypeMap;
type KnownTypes = { [k in KnownParamNames]: z.infer<TypeMap[k]> };

type ValidatorSpec<R, Q, B> = {
  query?: z.ZodType<Q, any, any>;
  body?: z.ZodType<B, any, any>;
  response?: z.ZodType<R, any, any>;
};

type PathToParams<Path extends string> = Path extends `${infer Start}/${infer Rest}`
  ? PathToParams<Start> & PathToParams<Rest>
  : Path extends `:${infer Param}`
  ? {
      [k in Param]: k extends keyof KnownTypes ? KnownTypes[k] : unknown;
    }
  : unknown;

type HandlerParams<Path extends string, Q, B> = {
  params: PathToParams<Path>;
  query: Q;
  body: B;
};

type ValidatedRequest = <Return, Path extends string, Q, B>(
  path: Path,
  spec: ValidatorSpec<Return, Q, B>,
  handler: (
    session: SessionBasicInfo,
    data: HandlerParams<Path, Q, B>,
    req: Request,
    res: Response,
  ) => MaybePromise<Return>,
  groupRequired?: boolean,
) => RequestHandler;

type ValidatedTxRequest = <Return, Path extends string, Q, B>(
  path: Path,
  spec: ValidatorSpec<Return, Q, B>,
  handler: (
    tx: ITask<any>,
    session: SessionBasicInfo,
    data: HandlerParams<Path, Q, B>,
    req: Request,
    res: Response,
  ) => MaybePromise<Return>,
  groupRequired?: boolean,
) => RequestHandler;

type TxRouteMethods = {
  [key in `${RouteMethod}Tx`]: ValidatedTxRequest;
};
type RouteMethods = {
  [key in RouteMethod]: ValidatedRequest;
};

type WrappedRouter = TxRouteMethods & RouteMethods & { router: Router };

export function createValidatingRouter(router: Router): WrappedRouter {
  const txFuns = recordFromPairs(
    RouteMethods.map<[`${RouteMethod}Tx`, ValidatedTxRequest]>(m => [
      `${m}Tx`,
      (path, spec, handler, groupRequired) =>
        router[m](path, Requests.validatedTxRequest(addParamType(path, spec), handler, groupRequired)),
    ]),
  );

  const funs = recordFromPairs(
    RouteMethods.map<[RouteMethod, ValidatedRequest]>(m => [
      m,
      (path, spec, handler, groupRequired) =>
        router[m](path, Requests.validatedRequest(addParamType(path, spec), handler, groupRequired)),
    ]),
  );

  return {
    ...txFuns,
    ...funs,
    router,
  };
}

type ParamValidator<Path extends string> = z.ZodType<PathToParams<Path>, any, any>;

function addParamType<Path extends string, Return, Q, B>(
  path: Path,
  spec: ValidatorSpec<Return, Q, B>,
): ValidatorSpec<Return, Q, B> & {
  params: ParamValidator<Path>;
} {
  return { ...spec, params: createParamType(path) };
}

function createParamType<Path extends string>(path: Path): ParamValidator<Path> {
  const types: KnownParamNames[] = path
    .split('/')
    .filter(p => p.startsWith(':'))
    .map(p => p.substring(1)) as any;
  const p = recordFromPairs(
    types.map<[KnownParamNames, typeof TypeMap[KnownParamNames]]>(t => [t, TypeMap[t]]).filter(p => isDefined(p[1])),
  );
  return z.object(p) as any;
}
