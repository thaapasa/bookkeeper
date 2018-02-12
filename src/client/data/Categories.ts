import * as B from 'baconjs';
import { flatten, toMap } from '../../shared/util/Arrays';
import { Category, Session } from '../../shared/types/Session';
import { validSessionE } from 'client/data/Login';
import { Map } from 'shared/util/Util';

export interface CategoryData {
  value: number;
  text: string;
};

export function getFullCategoryName(categoryId: number, categoryMap: Map<Category>): string {
  let categoryString = '';
  const category = categoryMap[categoryId];
  if (category.parentId) {
    categoryString += getFullCategoryName(category.parentId, categoryMap) + ' - ';
  }
  categoryString += category.name;
  return categoryString;
}

function catToDataSource(arr: Category[], categoryMap: Map<Category>): CategoryData[] {
  return arr ? flatten(arr.map(c => ([{ value: c.id, text: getFullCategoryName(c.id, categoryMap) }].concat(catToDataSource(c.children, categoryMap))))) :
    [];
}

function addToMap(arr: Category[], map: Map<Category>) {
  for (const c of arr) {
    map[c.id] = c;
    if (c.children) { addToMap(c.children, map); }
  }
}

function toCategoryMap(arr: Category[]): Map<Category> {
  const map: Map<Category> = {};
  addToMap(arr, map);
  return map;
}

export const categoryMapE: B.EventStream<any, Map<Category>> = validSessionE.map(s => toCategoryMap(s.categories));
export const categoryDataSourceP: B.Property<any, CategoryData[]> = B.combineWith((s: Session, map: Map<Category>) => catToDataSource(s.categories, map), validSessionE, categoryMapE);

export function isSubcategoryOf(subId: number, parentId: number, categoryMap: Map<Category>): boolean {
  const sub = categoryMap[subId];
  return sub && sub.parentId === parentId;
}
