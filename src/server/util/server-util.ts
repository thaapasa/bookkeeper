import { config } from '../config';
import sessions from '../data/sessions';
import * as moment from 'moment';
import { db } from '../data/db';
import { Session, SessionBasicInfo } from '../../shared/types/session';
import { Request, Response } from 'express';
import { TokenNotPresentError, InvalidGroupError } from '../../shared/types/errors';
const debug = require('debug')('bookkeeper:server');

interface ErrorInfo {
    type: 'error';
    code: string;
    cause?: any;
    info?: any;
};

function handleError(res: Response) {
    return (e: any) => {
        debug('Error', e);
        const data: ErrorInfo = { type: 'error', code: e.code ? e.code : 'INTERNAL_ERROR' };
        const status = typeof e.status === 'number' ? e.status : 500;
        if (config.showErrorCause) {
            data.cause = e.cause ? e.cause : e;
        }
        if (e.info) {
            data.info = e.info;
        }
        res.status(status).json(data);
    }
}

export function processUnauthorizedRequest(handler: (req: Request, res: Response) => Promise<any>) {
    return async (req: Request, res: Response): Promise<void> => {
        debug(req.method, req.url);
        try {
            const r = await handler(req, res);
            await setNoCacheHeaders(res).json(r);
        } catch (e) {
            handleError(res)(e);
        }
    };
}

export function processRequest(handler: (session: SessionBasicInfo, req: Request, res: Response) => Promise<any>, groupRequired?: boolean) {
    return async (req: Request, res: Response) => {
        debug(req.method, req.url);
        try {
            const token = getToken(req);
            const session = await sessions.tx.getSession(db)(token, req.query.groupId);
            if (groupRequired && !session.group.id) { throw new InvalidGroupError(); }
            const r = await handler(session, req, res);
            await setNoCacheHeaders(res).json(r);
        } catch (e) {
            handleError(res)(e);
        }
    };
}

const httpDateHeaderPattern = 'ddd, DD MMM YYYY HH:mm:ss';
function setNoCacheHeaders(res: Response): Response {
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    const time = moment().utc().format(httpDateHeaderPattern) + ' GMT';
    res.set('Date', time);
    res.set('Expires', time);
    return res;
}

const bearerMatch = /Bearer ([0-9a-zA-Z]*)/;
export function getToken(req: Request): string {
    const tmatch = bearerMatch.exec(req.header('Authorization') || '');
    const token = tmatch && tmatch.length > 0 ? tmatch[1] : undefined;
    if (!token) { throw new TokenNotPresentError(); }
    return token;
}
