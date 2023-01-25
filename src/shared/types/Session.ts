import { ExpenseInEditor } from '../expense/Expense';
import { MoneyLike } from '../util/Money';
import { DbObject } from './Common';
import { Source } from './Source';

export interface Group extends DbObject {
  name: string;
  defaultSourceId?: number | null;
}

export interface CategoryData {
  parentId: number | null;
  name: string;
}

export interface Category extends DbObject, CategoryData {
  children: Category[];
}

export type CategoryMap = Record<string, Category>;

export interface CategoryAndTotals extends Category {
  expenses: MoneyLike;
  income: MoneyLike;
  totalExpenses?: MoneyLike;
  totalIncome?: MoneyLike;
  children: CategoryAndTotals[];
}

export interface ExpenseShortcut {
  title: string;
  icon?: string;
  values: Partial<ExpenseInEditor>;
  background?: string;
}

export interface User extends DbObject {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image?: string;
  defaultGroupId?: number | null;
  expenseShortcuts: ExpenseShortcut[];
}

export interface SessionBasicInfo {
  token: string;
  user: User;
  group: Group;
  refreshToken: string;
  loginTime?: Date;
}

export interface Session extends SessionBasicInfo {
  groups: Group[];
  sources: Source[];
  categories: Category[];
  users: User[];
}
