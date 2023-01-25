import { CategoryMap, ObjectId } from 'shared/types';

export function getRootCategories(
  categoryIds: ObjectId[],
  categoryMap: CategoryMap
): ObjectId[] {
  const roots = new Set<number>();
  categoryIds.forEach(c => roots.add(getRootCategoryId(c, categoryMap)));
  return [...roots];
}

export function getRootCategoryId(
  categoryId: ObjectId,
  categoryMap: CategoryMap
) {
  let cur = categoryMap[categoryId];
  while (cur.parentId) {
    cur = categoryMap[cur.parentId];
  }
  return cur.id;
}

export function groupByRootCategories(
  categoryIds: ObjectId[],
  categoryMap: CategoryMap
): Record<ObjectId, ObjectId[]> {
  const data: Record<ObjectId, ObjectId[]> = {};
  categoryIds.forEach(c => {
    const root = getRootCategoryId(c, categoryMap);
    data[root] = [...data[root], c];
  });
  return data;
}
