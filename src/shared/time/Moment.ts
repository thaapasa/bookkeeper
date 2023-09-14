import moment, { Moment, MomentInput } from 'moment';

export const fiLocale = 'fi-FI';

// Setup Finnish locale globally
moment.locale(fiLocale);

export function toMoment(d?: MomentInput, pattern?: string): Moment {
  if (moment.isMoment(d)) {
    return d;
  }
  return moment(d, pattern);
}
