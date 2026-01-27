import * as B from 'baconjs';

import { Category, CategoryMap, ExpenseGroupingMap, Source, User } from 'shared/types';
import { unnest } from 'shared/util';
import { sourceMapP, userMapP, validSessionP } from 'client/data/Login';

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
            catToDataSource(c.children ?? [], categoryMap),
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

export const categoryMapP: B.Property<CategoryMap> = validSessionP.map(s =>
  toCategoryMap(s.categories),
);
export const categoryDataSourceP: B.Property<CategoryDataSource[]> = B.combineWith(
  (s, map) => catToDataSource(s.categories, map),
  validSessionP,
  categoryMapP,
);
export const expenseGroupingMapP: B.Property<ExpenseGroupingMap> = validSessionP.map(s =>
  Object.fromEntries(s.groupings.map(s => [String(s.id), s])),
);

export function isSubcategoryOf(
  subId: number,
  parentId: number,
  categoryMap: CategoryMap,
): boolean {
  const sub = categoryMap[subId];
  return sub && sub.parentId === parentId;
}

export interface UserDataProps {
  sourceMap: Record<string, Source>;
  userMap: Record<string, User>;
  categoryMap: CategoryMap;
  groupingMap: ExpenseGroupingMap;
}

export const userDataP: B.Property<UserDataProps> = B.combineTemplate({
  userMap: userMapP,
  sourceMap: sourceMapP,
  categoryMap: categoryMapP,
  groupingMap: expenseGroupingMapP,
});
