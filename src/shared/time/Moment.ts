import moment, { isMoment, Moment, MomentInput } from 'moment';

require('moment/locale/fi');

export const fiLocale = 'fi-FI';

// Setup Finnish locale globally
moment.locale(fiLocale);

export function toMoment(d?: MomentInput, pattern?: string): Moment {
  if (isMoment(d)) {
    return d;
  }
  return moment(d, pattern);
}
