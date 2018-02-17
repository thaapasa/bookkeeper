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
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      throw new errorType(p1, p2, p3);
    } else {
      return value;
    }
  };
}

export class Error {
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
  constructor(code: string, name: string) {
    super(code, `${ucFirst(name)} not found`, 404);
  }
}

export class InvalidExpense extends Error {
  constructor(message: string) {
    super('INVALID_EXPENSE', message, 400);
  }
}

export class AuthenticationError extends Error {
  constructor(code: string, cause: any, data?: any) {
    super(code, cause, 401, data);
  }
}

export class TokenNotPresentError extends Error {
  constructor() {
    super('TOKEN_MISSING', 'Authorization token missing', 401);
  }
}

export class InvalidGroupError extends Error {
  constructor() {
    super('INVALID_GROUP', 'Group not selected or invalid group', 400);
  }
}
