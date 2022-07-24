import { Expense } from './Expense';

export type ExpenseSplit = Pick<
  Expense,
  'categoryId' | 'sum' | 'sourceId' | 'title'
>;
