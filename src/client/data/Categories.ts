import * as B from 'baconjs';

import { Category, CategoryMap, Source, User } from 'shared/types';
import { unnest } from 'shared/util';
import { sourceMapE, userMapE, validSessionE } from 'client/data/Login';

export interface CategoryDataSource {
  value: number;
  text: string;
}

export function getFullCategoryName(categoryId: number, categoryMap: CategoryMap): string {
  let categoryString = '';
  const category = categoryMap[categoryId];
  if (!category) return '';
  if (category.parentId) {
    categoryString += getFullCategoryName(category.parentId, categoryMap) + ' - ';
  }
  categoryString += category.name;
  return categoryString;
}

function catToDataSource(arr: Category[], categoryMap: CategoryMap): CategoryDataSource[] {
  return arr
    ? unnest(
        arr.map(c =>
          [{ value: c.id, text: getFullCategoryName(c.id, categoryMap) }].concat(
            catToDataSource(c.children, categoryMap),
          ),
        ),
      )
    : [];
}

function addToMap(arr: Category[], map: CategoryMap) {
  for (const c of arr) {
    map[c.id] = c;
    if (c.children) {
      addToMap(c.children, map);
    }
  }
}

function toCategoryMap(arr: Category[]): CategoryMap {
  const map: CategoryMap = {};
  addToMap(arr, map);
  return map;
}

export const categoryMapE: B.EventStream<CategoryMap> = validSessionE.map(s => toCategoryMap(s.categories));
export const categoryDataSourceP: B.Property<CategoryDataSource[]> = B.combineWith(
  (s, map) => catToDataSource(s.categories, map),
  validSessionE,
  categoryMapE,
);

export function isSubcategoryOf(subId: number, parentId: number, categoryMap: CategoryMap): boolean {
  const sub = categoryMap[subId];
  return sub && sub.parentId === parentId;
}

export interface UserDataProps {
  sourceMap: Record<string, Source>;
  userMap: Record<string, User>;
  categoryMap: CategoryMap;
}

export const userDataE = B.combineTemplate({
  userMap: userMapE,
  sourceMap: sourceMapE,
  categoryMap: categoryMapE,
});
