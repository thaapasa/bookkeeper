import * as B from 'baconjs';
import { flatten } from '../../shared/util/Arrays';
import { Category, Session, Source, User } from '../../shared/types/Session';
import { validSessionE, userMapE, sourceMapE } from '../../client/data/Login';
import { Map } from '../../shared/util/Objects';

export interface CategoryData {
  value: number;
  text: string;
}

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

export interface UserDataProps {
  sourceMap: Map<Source>;
  userMap: Map<User>;
  categoryMap: Map<Category>;
}

export const userDataE = B.combineTemplate<any, UserDataProps>({
  userMap: userMapE,
  sourceMap: sourceMapE,
  categoryMap: categoryMapE,
});
