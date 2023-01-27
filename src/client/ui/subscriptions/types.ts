import { RecurringExpense } from 'shared/expense';
import { Category } from 'shared/types';
import { MoneyLike } from 'shared/util';

export interface RecurrenceTotals {
  recurrencePerYear: MoneyLike;
  recurrencePerMonth: MoneyLike;
}

export interface CategorySubscriptions {
  category: Category;
  items: RecurringExpense[];
  totals: RecurrenceTotals;
}

export interface SubscriptionGroup {
  root: Category;
  rootItems?: RecurringExpense[];
  rootTotals?: RecurrenceTotals;
  children: CategorySubscriptions[];
}
