import { DateRange, toDayjs, toISODate } from 'shared/time';

export function getRangeForQueries(range: DateRange | undefined): DateRange {
  if (!range)
    return {
      startDate: toISODate(toDayjs().minus({ years: 5 }).startOf('year')),
      endDate: toISODate(toDayjs()),
    };
  const now = toDayjs();
  const startDateTime = toDayjs(range.startDate);
  const endDateTime = toDayjs(range.endDate);
  return {
    startDate: now < startDateTime ? toISODate(now) : range.startDate,
    endDate: now < endDateTime ? toISODate(now) : range.endDate,
  };
}
