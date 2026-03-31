import * as B from 'baconjs';

import { Category, CategoryMap, ExpenseGroupingRef, Group, Source, User } from 'shared/types';
import { CategoryDataSource, categoryDataSourceP, categoryMapP } from 'client/data/Categories';
import { sourceMapP, validSessionP } from 'client/data/Login';

export interface ExpenseDialogData {
  sources: Source[];
  categories: Category[];
  user: User;
  group: Group;
  sourceMap: Record<string, Source>;
  categorySource: CategoryDataSource[];
  categoryMap: CategoryMap;
  groupings: ExpenseGroupingRef[];
  users: User[];
}

/** Bacon.js property providing session data needed by the expense dialog. */
export const expenseDialogDataP: B.Property<ExpenseDialogData> = B.combineTemplate({
  sources: validSessionP.map(s => s.sources),
  categories: validSessionP.map(s => s.categories),
  user: validSessionP.map(s => s.user),
  group: validSessionP.map(s => s.group),
  sourceMap: sourceMapP,
  categorySource: categoryDataSourceP,
  categoryMap: categoryMapP,
  groupings: validSessionP.map(s => s.groupings),
  users: validSessionP.map(s => s.users),
});
