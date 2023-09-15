import 'dayjs/locale/fi';

import dayjs, { Dayjs } from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';

export const fiLocale = 'fi';

export type DayjsInput = dayjs.ConfigType;

dayjs.extend(isLeapYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(dayOfYear);
dayjs.extend(utc);

// Setup Finnish locale globally
dayjs.locale(fiLocale);

dayjs();

export function toDayjs(d?: DayjsInput, pattern?: string): Dayjs {
  if (dayjs.isDayjs(d)) {
    return d;
  }
  return dayjs(d, pattern);
}
