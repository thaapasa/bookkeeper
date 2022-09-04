import { ZodError, ZodType } from 'zod';

import { BkError } from 'shared/types/Errors';

export function validate<T>(
  data: unknown,
  codec: ZodType<T>,
  context: string
): T {
  try {
    return codec.parse(data);
  } catch (e) {
    if (e instanceof ZodError) {
      throw new DataValidationError(e, data, context);
    } else throw e;
  }
}

export function validateOr<T>(
  data: unknown,
  codec: ZodType<T> | undefined,
  def: T,
  context: string
): T {
  return codec ? validate(data, codec, context) : def;
}

export class DataValidationError extends BkError {
  constructor(error: ZodError, data: any, context: string) {
    super('VALIDATION_ERROR', `Data format is invalid at ${context}`, 400, {
      data,
      error: error.format(),
    });
    Object.setPrototypeOf(this, DataValidationError.prototype);
  }
}
