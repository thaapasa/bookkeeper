import { DateRange, toDayjs, toISODate } from 'shared/time';

export function getRangeForQueries(range: DateRange | undefined): DateRange {
  if (!range)
    return {
      startDate: toISODate(toDayjs().subtract(5, 'years').startOf('year')),
      endDate: toISODate(toDayjs()),
    };
  const now = toDayjs();
  return {
    startDate: now.isBefore(range.startDate, 'day') ? toISODate(now) : range.startDate,
    endDate: now.isBefore(range.endDate, 'day') ? toISODate(now) : range.endDate,
  };
}
