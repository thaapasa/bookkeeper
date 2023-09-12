import { Moment } from 'moment';

import { RecurrencePeriod } from 'shared/expense';
import { fromISODate } from 'shared/time';

export function calculateNextRecurrence(from: string | Moment, period: RecurrencePeriod): Moment {
  const date = fromISODate(from);
  return date.add(period.amount, period.unit);
}
