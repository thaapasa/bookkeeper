import * as React from 'react';

import { AllPeriod, MonthPeriod, YearPeriod } from 'shared/util/Period';
import { compareDates } from 'shared/util/Time';
import { TypedDateRange } from 'shared/util/TimeRange';

import { DateRangeSelectorProps, toMonthRange, toYearRange } from './Common';
import { PeriodSelector } from './PeriodSelector';

type RangePeriod = AllPeriod | YearPeriod | MonthPeriod;
const AllowedPeriods: RangePeriod['type'][] = ['all', 'year', 'month'];

const DateRangeSelectorImpl: React.FC<DateRangeSelectorProps> = ({
  onSelectRange,
  dateRange,
}) => {
  const [period, setPeriod] = React.useState<RangePeriod>(
    rangeToPeriod(dateRange)
  );
  React.useEffect(
    () => onSelectRange(periodToRange(period)),
    [onSelectRange, period]
  );

  return (
    <PeriodSelector
      period={period}
      onSelect={setPeriod}
      allowed={AllowedPeriods}
    />
  );
};

function rangeToPeriod(range: TypedDateRange | undefined): RangePeriod {
  switch (range?.type) {
    case 'year':
      return { type: 'year', year: range.start.getFullYear() };
    case 'month':
      return {
        type: 'month',
        year: range.start.getFullYear(),
        month: range.start.getMonth() + 1,
      };
    default:
      return { type: 'all' };
  }
}

function periodToRange(period: RangePeriod): TypedDateRange | undefined {
  switch (period.type) {
    case 'year':
      return toYearRange(period.year);
    case 'month':
      return toMonthRange(period.year, period.month);
    default:
      return undefined;
  }
}

export const DateRangeSelector = React.memo(
  DateRangeSelectorImpl,
  (prev, next) =>
    prev.dateRange?.type === next.dateRange?.type &&
    compareDates(prev.dateRange?.start, next.dateRange?.start) === 0 &&
    compareDates(prev.dateRange?.end, next.dateRange?.end) === 0
);
