import * as B from 'baconjs';
import { sourceMapE, userMapE, validSessionE } from '../../client/data/Login';
import { Category, Source, User } from '../../shared/types/Session';
import { unnest } from '../../shared/util/Arrays';

export interface CategoryDataSource {
  value: number;
  text: string;
}

export function getFullCategoryName(
  categoryId: number,
  categoryMap: Record<string, Category>
): string {
  let categoryString = '';
  const category = categoryMap[categoryId];
  if (category.parentId) {
    categoryString +=
      getFullCategoryName(category.parentId, categoryMap) + ' - ';
  }
  categoryString += category.name;
  return categoryString;
}

function catToDataSource(
  arr: Category[],
  categoryMap: Record<string, Category>
): CategoryDataSource[] {
  return arr
    ? unnest(
        arr.map(c =>
          [
            { value: c.id, text: getFullCategoryName(c.id, categoryMap) },
          ].concat(catToDataSource(c.children, categoryMap))
        )
      )
    : [];
}

function addToMap(arr: Category[], map: Record<string, Category>) {
  for (const c of arr) {
    map[c.id] = c;
    if (c.children) {
      addToMap(c.children, map);
    }
  }
}

function toCategoryMap(arr: Category[]): Record<string, Category> {
  const map: Record<string, Category> = {};
  addToMap(arr, map);
  return map;
}

export const categoryMapE: B.EventStream<
  Record<string, Category>
> = validSessionE.map(s => toCategoryMap(s.categories));
export const categoryDataSourceP: B.Property<
  CategoryDataSource[]
> = B.combineWith(
  (s, map) => catToDataSource(s.categories, map),
  validSessionE,
  categoryMapE
);

export function isSubcategoryOf(
  subId: number,
  parentId: number,
  categoryMap: Record<string, Category>
): boolean {
  const sub = categoryMap[subId];
  return sub && sub.parentId === parentId;
}

export interface UserDataProps {
  sourceMap: Record<string, Source>;
  userMap: Record<string, User>;
  categoryMap: Record<string, Category>;
}

export const userDataE = B.combineTemplate({
  userMap: userMapE,
  sourceMap: sourceMapE,
  categoryMap: categoryMapE,
});
