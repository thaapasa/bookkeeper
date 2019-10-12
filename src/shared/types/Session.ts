import { DbObject } from './Common';
import { MoneyLike } from '../util/Money';

export interface Group extends DbObject {
  name: string;
  defaultSourceId?: number | null;
}

export interface UserShare {
  userId: number;
  share: number;
}

export interface Source extends DbObject {
  name: string;
  abbreviation: string | null;
  shares: number;
  users: UserShare[];
  image?: string;
}

export interface CategoryData {
  parentId: number | null;
  name: string;
}

export interface Category extends DbObject, CategoryData {
  children: Category[];
}

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
  defaultGroupId?: number | null;
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
