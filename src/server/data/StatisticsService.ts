import { DateRange, toDateTime, toISODate } from 'shared/time';

export function getRangeForQueries(range: DateRange | undefined): DateRange {
  if (!range)
    return {
      startDate: toISODate(toDateTime().minus({ years: 5 }).startOf('year')),
      endDate: toISODate(toDateTime()),
    };
  const now = toDateTime();
  const startDateTime = toDateTime(range.startDate);
  const endDateTime = toDateTime(range.endDate);
  return {
    startDate: now < startDateTime ? toISODate(now) : range.startDate,
    endDate: now < endDateTime ? toISODate(now) : range.endDate,
  };
}
