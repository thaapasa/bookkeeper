import { RecurringExpense } from 'shared/expense';
import { Category } from 'shared/types';

export interface CategorySubscriptions {
  category: Category;
  items: RecurringExpense[];
}

export interface SubscriptionGroup {
  root: Category;
  rootItems?: RecurringExpense[];
  children: CategorySubscriptions[];
}
