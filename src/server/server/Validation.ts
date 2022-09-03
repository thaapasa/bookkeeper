import { ZodError, ZodType } from 'zod';

import { BkError } from 'shared/types/Errors';

export function validate<T>(data: unknown, codec: ZodType<T>): T {
  try {
    return codec.parse(data);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new DataValidationError(e);
    } else throw e;
  }
}

export function validateOr<T>(
  data: unknown,
  codec: ZodType<T> | undefined,
  def: T
): T {
  return codec ? validate(data, codec) : def;
}

export class DataValidationError extends BkError {
  constructor(error: ZodError) {
    super('VALIDATION_ERROR', 'Data format is invalid', 400, error.format());
    Object.setPrototypeOf(this, DataValidationError.prototype);
  }
}
