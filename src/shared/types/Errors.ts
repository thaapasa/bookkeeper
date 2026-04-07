import { joinStr } from '../util/Strings';
import { ucFirst } from '../util/Util';

const colonSpaced = joinStr(': ');
export function toReadableErrorMessage(e: unknown) {
  const err = e as { message?: string; data?: { cause?: string } } | undefined;
  return colonSpaced`${err?.message}: ${err?.data?.cause}`;
}

export class BkError extends Error {
  public code: string;
  public cause: unknown;
  public status: number;
  public data: unknown;
  constructor(code: string, cause: unknown, status: number, data?: unknown) {
    super(
      typeof cause === 'object' && cause && 'message' in cause
        ? String((cause as { message: unknown }).message)
        : String(cause),
    );
    this.code = code;
    this.cause = cause;
    this.status = status;
    this.data = data;
  }
}

export class NotFoundError extends BkError {
  constructor(code: string, name: string, id?: string | number) {
    super(code, `${ucFirst(name)}${id ? ` with id ${id}` : ''} not found`, 404);
  }
}

export class InvalidExpense extends BkError {
  constructor(message: string) {
    super('INVALID_EXPENSE', message, 400);
  }
}

export class AuthenticationError extends BkError {
  constructor(code: string, cause: unknown, data?: unknown) {
    super(code, cause, 401, data);
  }
}

export class InvalidInputError extends BkError {
  constructor(code: string, cause: string) {
    super(code, cause, 400);
  }
}

export class TokenNotPresentError extends BkError {
  constructor() {
    super('TOKEN_MISSING', 'Authorization token missing', 401);
  }
}

export class InvalidGroupError extends BkError {
  constructor() {
    super('INVALID_GROUP', 'Group not selected or invalid group', 400);
  }
}
