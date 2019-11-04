import * as array from 'fp-ts/lib/Array';
import { fold } from 'fp-ts/lib/Either';
import { option } from 'fp-ts/lib/Option';
import * as t from 'io-ts';

const jsToString = (value: t.mixed) =>
  value === undefined ? 'undefined' : JSON.stringify(value);

// Intersections seem to be modeled as separate InterfaceType array entries with number keys
const nonNumberInterfaceType = (c: t.ContextEntry) =>
  (c.type as any)._tag !== 'InterfaceType' || c.key !== String(Number(c.key));

// The context entry with an empty key is the original type ("default
// context"), not an type error.
const nonEmptyKey = (c: string) => c.length > 0;

const formatValidationError = (error: t.ValidationError) => {
  const path = error.context
    .filter(nonNumberInterfaceType)
    .map(c => c.key)
    .filter(nonEmptyKey)
    .join('.');

  // The actual error is last in context
  const maybeErrorContext = array.last(
    // https://github.com/gcanti/fp-ts/pull/544/files
    error.context as t.ContextEntry[]
  );

  return option.map(maybeErrorContext, ctx => {
    const expectedType = ctx.type.name;
    return (
      `Expecting ${expectedType}` +
      (path === '' ? '' : ` at ${path}`) +
      ` but instead got: ${jsToString(error.value)}.`
    );
  });
};

export const ioErrorReporter = <T>(v: t.Validation<T>) =>
  fold(
    (errors: any[]) => array.compact(errors.map(formatValidationError)),
    () => []
  )(v);
