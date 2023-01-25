import { RecurringExpense } from 'shared/expense';
import { CategoryMap, ObjectId } from 'shared/types';

import { getRootCategoryId } from '../utils/Categories';
import { SubscriptionGroup } from './SubscriptionTypes';

export function groupSubscriptions(
  items: RecurringExpense[],
  categories: CategoryMap
): SubscriptionGroup[] {
  const byRoot: Record<ObjectId, SubscriptionGroup> = {};
  for (const item of items) {
    const rootCat = getRootCategoryId(item.categoryId, categories);
    const group: SubscriptionGroup =
      rootCat in byRoot
        ? byRoot[rootCat]
        : { root: categories[rootCat], children: [] };
    byRoot[rootCat] = group;
    if (rootCat === item.categoryId) {
      group.rootItems = (group.rootItems ?? []).concat(item);
    } else {
      const cat = group.children.find(c => c.category.id === item.categoryId);
      if (cat) {
        cat.items.push(item);
      } else {
        group.children.push({
          category: categories[item.categoryId],
          items: [item],
        });
      }
    }
  }
  return Object.values(byRoot);
}
