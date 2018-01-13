import { config } from '../config';
import sessions from '../data/sessions';
import * as moment from 'moment';
import { db } from '../data/db';
import { Session, SessionBasicInfo } from '../../shared/types/session';
import { Request, Response } from 'express';
const debug = require('debug')('bookkeeper:server');

interface ErrorInfo {
    type: 'error';
    code: string;
    cause?: any;
    info?: any;
};

export function handleError(res) {
    return e => {
        debug('Error', e);
        const data: ErrorInfo = { type: 'error', code: e.code ? e.code : 'INTERNAL_ERROR' };
        const status = typeof(e.status) == 'number' ? e.status : 500;
        if (config.showErrorCause) {
            data.cause = e.cause ? e.cause : e;
        }
        if (e.info) {
            data.info = e.info;
        }
        res.status(status).json(data);
    }
}

export function processUnauthorizedRequest(handler) {
    return (req, res) => {
        debug(req.method, req.url);
        return handler(req, res)
            .then(r => setNoCacheHeaders(res).json(r))
            .catch(handleError(res));
    };
}

export function processRequest(handler: (session: SessionBasicInfo, req: Request, res: Response) => any, groupRequired?) {
    return (req: Request, res: Response) => {
        debug(req.method, req.url);
        try {
            const token = getToken(req);
            sessions.tx.getSession(db)(token, req.query.groupId)
                .then(checkGroup(groupRequired))
                .then(session => handler(session, req, res))
                .then(r => setNoCacheHeaders(res).json(r))
                .catch(handleError(res));
        } catch (e) {
            handleError(res)(e);
        }
    };
}


function InvalidGroupError() {
    this.code = "INVALID_GROUP";
    this.status = 400;
    this.cause = "Group not selected or invalid group";
}
InvalidGroupError.prototype = new Error();

function checkGroup(required) {
    return s => {
        if (required && !s.group.id) throw new InvalidGroupError();
        else return s;
    };
}


const httpDateHeaderPattern = "ddd, DD MMM YYYY HH:mm:ss";
function setNoCacheHeaders(res) {
    res.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
    res.set("Pragma", "no-cache");
    const time = moment().utc().format(httpDateHeaderPattern) + " GMT";
    res.set("Date", time);
    res.set("Expires", time);
    return res;
}

function TokenNotPresentError() {
    this.code = "TOKEN_MISSING";
    this.status = 401;
    this.cause = "Authorization token missing";
}
TokenNotPresentError.prototype = new Error();

const bearerMatch = /Bearer ([0-9a-zA-Z]*)/;
export function getToken(req: Request): string {
    const tmatch = bearerMatch.exec(req.header('Authorization') || '');
    const token = tmatch && tmatch.length > 0 ? tmatch[1] : undefined;
    if (!token) { throw new TokenNotPresentError(); }
    return token;
}

export function getId(pathRE, req, position?) {
    if (position === undefined) position = 1;
    return parseInt(pathRE.exec(req.url)[position], 10);
}
