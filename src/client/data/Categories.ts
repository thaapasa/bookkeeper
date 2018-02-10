import * as state from './State';
import * as B from 'baconjs';
import { flatten, toMap } from '../../shared/util/Arrays';
import { Category } from '../../shared/types/Session';
import { validSessionE } from 'client/data/Login';
import { Map } from 'shared/util/Util';

export interface CategoryData {
  value: number;
  text: string;
};

export function getFullName(categoryId: number): string {
  let categoryString = '';
  const category = state.get('categoryMap')[categoryId];
  if (category.parentId) {
    categoryString += getFullName(category.parentId) + ' - ';
  }
  categoryString += category.name;
  return categoryString;
}

export function get(categoryId): Category {
  return state.get('categoryMap')[categoryId];
}

function catToDataSource(arr: any[]): any[] {
  return arr ? flatten(arr.map(c => ([{ value: c.id, text: getFullName(c.id) }].concat(catToDataSource(c.children))))) :
    [];
}

export const categoryDataSourceE: B.EventStream<any, CategoryData[]> = validSessionE.map(s => catToDataSource(s.categories));
export const categoryMapE: B.EventStream<any, Map<Category>> = validSessionE.map(s => toMap(s.categories, 'id'));

export function getDataSource() {
  return catToDataSource(state.get('categories'));
}

export function isSubcategoryOf(subId: number, parentId: number): boolean {
  const map = state.get('categoryMap');
  const sub = map[subId];
  return sub && sub.parentId === parentId;
}
