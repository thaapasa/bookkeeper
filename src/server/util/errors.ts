import * as util from '../../shared/util/util';

export function undefinedToError(errorType, p1?, p2?, p3?) {
    return value => {
        if (value === undefined) throw new errorType(p1, p2, p3);
        else return value;
    }
};

export function emptyToError(errorType, p1?, p2?, p3?) {
    return value => {
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) throw new errorType(p1, p2, p3);
        else return value;
    }
};

class Error {
    public code: string;
    public cause: any;
    public status: number;
    public data: any;
    constructor(code: string, cause: any, status: number, data?: any) {
        this.code = code;
        this.cause = cause;
        this.status = status;
        this.data = data;
    }
}

export class NotFoundError extends Error {
    constructor(code, name) {
        super(code, `${util.ucFirst(name)} not found`, 404);
    }
}

export class AuthenticationError extends Error {
    constructor(code, cause, data?) {
        super(code, cause, 401, data);
    }
}
