import { joinStr } from 'shared/util';

import { ucFirst } from '../util/Util';

export function undefinedToError(errorType: any, p1?: any, p2?: any, p3?: any) {
  return (value: any) => {
    if (value === undefined) {
      throw new errorType(p1, p2, p3);
    } else {
      return value;
    }
  };
}

export function emptyToError(errorType: any, p1?: any, p2?: any, p3?: any) {
  return (value: any) => {
    if (
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0)
    ) {
      throw new errorType(p1, p2, p3);
    } else {
      return value;
    }
  };
}

const colonSpaced = joinStr(': ');
export function toReadableErrorMessage(e: any) {
  return colonSpaced`${e?.message}: ${e?.data?.cause}`;
}

export class BkError extends Error {
  public code: string;
  public cause: any;
  public status: number;
  public data: any;
  constructor(code: string, cause: any, status: number, data?: any) {
    super(String(cause));
    this.code = code;
    this.cause = cause;
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, BkError.prototype);
  }
}

export class NotFoundError extends BkError {
  constructor(code: string, name: string, id?: string | number) {
    super(code, `${ucFirst(name)}${id ? ` with id ${id}` : ''} not found`, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class InvalidExpense extends BkError {
  constructor(message: string) {
    super('INVALID_EXPENSE', message, 400);
    Object.setPrototypeOf(this, InvalidExpense.prototype);
  }
}

export class AuthenticationError extends BkError {
  constructor(code: string, cause: any, data?: any) {
    super(code, cause, 401, data);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class InvalidInputError extends BkError {
  constructor(code: string, cause: string) {
    super(code, cause, 400);
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}

export class TokenNotPresentError extends BkError {
  constructor() {
    super('TOKEN_MISSING', 'Authorization token missing', 401);
    Object.setPrototypeOf(this, TokenNotPresentError.prototype);
  }
}

export class InvalidGroupError extends BkError {
  constructor() {
    super('INVALID_GROUP', 'Group not selected or invalid group', 400);
    Object.setPrototypeOf(this, InvalidGroupError.prototype);
  }
}
