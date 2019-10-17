import * as t from 'io-ts';
import moment from 'moment';
require('moment/locale/fi');

export const fiLocale = 'fi-FI';

// Setup Finnish locale globally
moment.locale(fiLocale);

export const ISODatePattern = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const TISODate = t.refinement(t.string, s => ISODatePattern.test(s));
export type ISODate = t.TypeOf<typeof TISODate>;
