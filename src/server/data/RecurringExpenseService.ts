import { Dayjs } from 'dayjs';

import { RecurrencePeriod } from 'shared/expense';
import { fromISODate } from 'shared/time';

export function calculateNextRecurrence(from: string | Dayjs, period: RecurrencePeriod): Dayjs {
  const date = fromISODate(from);
  if (period.unit === 'quarters') {
    // Convert quarters to months
    return date.add(period.amount * 3, 'months');
  } else {
    return date.add(period.amount, period.unit);
  }
}
