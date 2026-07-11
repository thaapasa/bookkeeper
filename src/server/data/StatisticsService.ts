import { DateRange, toDateTime, toISODate } from 'shared/time';

/** Range for the yearly summary: the last 10 calendar years, up to today */
export function getYearlySummaryRange(): DateRange {
  const now = toDateTime();
  return {
    startDate: toISODate(now.minus({ years: 9 }).startOf('year')),
    endDate: toISODate(now),
  };
}

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
