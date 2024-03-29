import { ExpenseShortcut } from '../expense/Shortcut';
import { MoneyLike } from '../util/Money';
import { DbObject } from './Common';
import { ExpenseGroupingRef } from './Grouping';
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
  fullName: string;
  children?: Category[];
  parentName?: string;
}

export type CategoryMap = Record<string, Category>;
export type ExpenseGroupingMap = Record<string, ExpenseGroupingRef>;

export interface CategoryAndTotals extends Category {
  expenses: MoneyLike;
  income: MoneyLike;
  totalExpenses?: MoneyLike;
  totalIncome?: MoneyLike;
  children: CategoryAndTotals[];
}

export interface User extends DbObject {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image?: string;
  imageLarge?: string;
  defaultGroupId?: number | null;
}

export interface SessionBasicInfo {
  token: string;
  user: User;
  group: Group;
  refreshToken: string;
  shortcuts: ExpenseShortcut[];
  loginTime?: Date;
}

export interface Session extends SessionBasicInfo {
  groups: Group[];
  sources: Source[];
  categories: Category[];
  users: User[];
  groupings: ExpenseGroupingRef[];
}
