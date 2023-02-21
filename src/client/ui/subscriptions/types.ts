import { ExpenseReport, RecurringExpense } from 'shared/expense';
import { Category } from 'shared/types';
import { MoneyLike } from 'shared/util';

export interface RecurrenceTotals {
  recurrencePerYear: MoneyLike;
  recurrencePerMonth: MoneyLike;
}

export interface CategorySubscriptions {
  category: Category;
  items: SubscriptionItem[];
  totals: RecurrenceTotals;
}

export type SubscriptionItem = RecurringExpense | ExpenseReport;

export interface SubscriptionGroup {
  colorIndex: number;
  root: Category;
  rootItems?: SubscriptionItem[];
  rootTotals?: RecurrenceTotals;
  children: CategorySubscriptions[];
  allTotals: RecurrenceTotals;
}

export interface SubscriptionsData {
  groups: SubscriptionGroup[];
  totals: RecurrenceTotals;
}
