import { toISODate, toMoment } from 'shared/util/Time';
import { DateRange } from 'shared/util/TimeRange';

export function getRangeForQueries(range: DateRange | undefined): DateRange {
  if (!range)
    return {
      startDate: toISODate(toMoment().subtract(5, 'years').startOf('year')),
      endDate: toISODate(toMoment()),
    };
  const now = toMoment();
  return {
    startDate: now.isBefore(range.startDate, 'day')
      ? toISODate(now)
      : range.startDate,
    endDate: now.isBefore(range.endDate, 'day')
      ? toISODate(now)
      : range.endDate,
  };
}
