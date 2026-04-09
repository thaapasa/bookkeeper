import { dateTimeFromParts, ISOMonth, toDateTime, toISODate, TypedDateRange } from 'shared/time';

export function isValidYear(year: string | number): boolean {
  const y = Number(year);
  return String(y) === String(year) && y === Math.round(y) && y > 2000 && y < 2100;
}

export function isValidMonth(month: string | number): boolean {
  const m = Number(month);
  return String(m) === String(month) && m === Math.round(m) && m >= 1 && m <= 12;
}

export function toMonthRange(year: string | number, month: string | number): TypedDateRange {
  const m = dateTimeFromParts(year, month, 1);
  return {
    type: 'month',
    start: toISODate(m.startOf('month')),
    end: toISODate(m.endOf('month')),
  };
}

export function parseMonthRange(monthInput: ISOMonth): TypedDateRange {
  const m = toDateTime(monthInput + '-01');
  return {
    type: 'month',
    start: toISODate(m.startOf('month')),
    end: toISODate(m.endOf('month')),
  };
}

export function toYearRange(year: string | number): TypedDateRange {
  const m = dateTimeFromParts(year, 1, 1);
  return {
    type: 'year',
    start: toISODate(m.startOf('year')),
    end: toISODate(m.endOf('year')),
  };
}

export function nextMonth(year: number, month: number): [number, number] {
  return month >= 12 ? [year + 1, 1] : [year, month + 1];
}
export function prevMonth(year: number, month: number): [number, number] {
  return month <= 1 ? [year - 1, 12] : [year, month - 1];
}
