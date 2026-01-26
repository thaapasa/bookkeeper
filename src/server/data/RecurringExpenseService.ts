import { DateTime } from 'luxon';

import { RecurrencePeriod } from 'shared/expense';
import { fromISODate } from 'shared/time';

export function calculateNextRecurrence(
  from: string | DateTime,
  period: RecurrencePeriod,
): DateTime {
  const date = fromISODate(from);
  if (period.unit === 'quarters') {
    // Convert quarters to months
    return date.plus({ months: period.amount * 3 });
  } else {
    return date.plus({ [period.unit]: period.amount });
  }
}
