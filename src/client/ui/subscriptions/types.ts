import { Subscription } from 'shared/expense';
import { Category } from 'shared/types';
import { MoneyLike } from 'shared/util';

export interface RecurrenceTotals {
  recurrencePerYear: MoneyLike;
  recurrencePerMonth: MoneyLike;
}

export interface CategorySubscriptions {
  category: Category;
  items: Subscription[];
  totals: RecurrenceTotals;
}

export interface SubscriptionGroup {
  colorIndex: number;
  root: Category;
  rootItems?: Subscription[];
  rootTotals?: RecurrenceTotals;
  children: CategorySubscriptions[];
  allTotals: RecurrenceTotals;
}

export interface SubscriptionsData {
  groups: SubscriptionGroup[];
  totals: RecurrenceTotals;
}
