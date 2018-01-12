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

export function NotFoundError(code, name) {
    this.code = code;
    this.status = 404;
    this.cause = `${util.ucFirst(name)} not found`;
}
NotFoundError.prototype = new Error();

export function AuthenticationError(code, cause, data) {
    this.status = 401;
    this.code = code;
    this.cause = cause;
    this.data = data;
    return this;
}
AuthenticationError.prototype = new Error();
