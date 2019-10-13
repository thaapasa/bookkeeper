import * as t from 'io-ts';

export const ISODatePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const TISODate = t.refinement(t.string, s => ISODatePattern.test(s));
export type ISODate = t.TypeOf<typeof TISODate>;
