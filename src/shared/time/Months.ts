import { DateLike, toDayjs } from './Time';

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
  // Luxon months are 1-based, so no need to add 1
  const i = toDayjs(monthNumber).month;
  return months[i];
}

export function toMonthName(x: DateLike) {
  const m = toDayjs(x);
  return getFinnishMonthName(m.month) + ' ' + m.year;
}

export function isSameMonth(a: DateLike, b: DateLike) {
  const am = toDayjs(a);
  const bm = toDayjs(b);
  if (am.year !== bm.year) {
    return false;
  }
  return am.month === bm.month;
}
