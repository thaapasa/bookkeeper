import { toMoment } from './Moment';
import { DateLike } from './Time';

const months = [
  '',
  'Tammikuu',
  'Helmikuu',
  'Maaliskuu',
  'Huhtikuu',
  'Toukokuu',
  'Kesäkuu',
  'Heinäkuu',
  'Elokuu',
  'Syyskuu',
  'Lokakuu',
  'Marraskuu',
  'Joulukuu',
];

export function getFinnishMonthName(monthNumber: number | string | DateLike): string {
  if (typeof monthNumber === 'number') {
    return months[monthNumber];
  }
  if (typeof monthNumber === 'string' && /^[0-9]*$/.exec(monthNumber)) {
    return months[parseInt(monthNumber, 10)];
  }
  const i = toMoment(monthNumber).get('month') + 1;
  return months[i];
}

export function toMonthName(x: DateLike) {
  const m = toMoment(x);
  return getFinnishMonthName(m.get('month') + 1) + ' ' + m.get('year');
}

export function isSameMonth(a: DateLike, b: DateLike) {
  const am = toMoment(a);
  const bm = toMoment(b);
  if (am.get('year') !== bm.get('year')) {
    return false;
  }
  return am.get('month') === bm.get('month');
}
