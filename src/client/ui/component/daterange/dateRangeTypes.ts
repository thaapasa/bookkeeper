import { TypedDateRange } from 'shared/time';

export type RangeType = TypedDateRange['type'];
export type RangeTypeOrNone = RangeType | 'none';

export interface DateRangeSelectorProps {
  dateRange?: TypedDateRange;
  onSelectRange: (range?: TypedDateRange) => void;
}

export type SelectorProps = DateRangeSelectorProps;
