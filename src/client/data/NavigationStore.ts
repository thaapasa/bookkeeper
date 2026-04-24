import { create } from 'zustand';

import { ISODate, monthRange, toISODate, TypedDateRange } from 'shared/time';

import { expensePagePath } from '../util/Links';

export interface NavigationConfig {
  pathPrefix: string;
  dateRange: TypedDateRange;
}

interface NavigationState {
  pathPrefix: string;
  dateRange: TypedDateRange;

  /** Target date for cross-month expense navigation. */
  expenseNavigationTarget: ISODate | null;
  /** Optional expense id to scroll to / highlight after navigation. */
  expenseNavigationTargetId: number | null;
  /** Incremented on each navigation request so consumers can react via useEffect. */
  expenseNavigationSeq: number;

  setNavigation: (config: NavigationConfig) => void;
  navigateToExpenseDate: (date: ISODate, id?: number) => void;
}

export const useNavigationStore = create<NavigationState>(set => ({
  pathPrefix: expensePagePath,
  dateRange: monthRange(toISODate()),
  expenseNavigationTarget: null,
  expenseNavigationTargetId: null,
  expenseNavigationSeq: 0,

  setNavigation: config => set({ pathPrefix: config.pathPrefix, dateRange: config.dateRange }),
  navigateToExpenseDate: (date, id) =>
    set(s => ({
      expenseNavigationTarget: date,
      expenseNavigationTargetId: id && id > 0 ? id : null,
      expenseNavigationSeq: s.expenseNavigationSeq + 1,
    })),
}));

/** Push a date to trigger cross-month navigation in MonthView. */
export function navigateToExpenseDate(date: ISODate, id?: number) {
  useNavigationStore.getState().navigateToExpenseDate(date, id);
}
