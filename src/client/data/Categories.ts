import { Category, CategoryMap, ExpenseGroupingMap, Source, User } from 'shared/types';
import { unnest } from 'shared/util';

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

export function catToDataSource(arr: Category[], categoryMap: CategoryMap): CategoryDataSource[] {
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

export function toCategoryMap(arr: Category[]): CategoryMap {
  const map: CategoryMap = {};
  addToMap(arr, map);
  return map;
}

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
