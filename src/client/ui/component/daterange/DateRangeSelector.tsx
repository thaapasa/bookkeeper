import * as React from 'react';

import {
  AllPeriod,
  compareDates,
  MonthPeriod,
  toDateTime,
  TypedDateRange,
  YearPeriod,
} from 'shared/time';

import { type DateRangeSelectorProps } from './dateRangeTypes';
import { toMonthRange, toYearRange } from './dateRangeUtils';
import { PeriodSelector } from './PeriodSelector';

type RangePeriod = AllPeriod | YearPeriod | MonthPeriod;
const AllowedPeriods: RangePeriod['type'][] = ['all', 'year', 'month'];

const DateRangeSelectorImpl: React.FC<DateRangeSelectorProps> = ({ onSelectRange, dateRange }) => {
  const [period, setPeriod] = React.useState<RangePeriod>(rangeToPeriod(dateRange));
  React.useEffect(() => onSelectRange(periodToRange(period)), [onSelectRange, period]);

  return <PeriodSelector period={period} onSelect={setPeriod} allowed={AllowedPeriods} />;
};

function rangeToPeriod(range: TypedDateRange | undefined): RangePeriod {
  switch (range?.type) {
    case 'year': {
      const s = toDateTime(range.start);
      return { type: 'year', year: s.year };
    }
    case 'month': {
      const s = toDateTime(range.start);
      return { type: 'month', year: s.year, month: s.month };
    }
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
    compareDates(prev.dateRange?.end, next.dateRange?.end) === 0,
);
