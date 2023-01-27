import { RecurringExpense } from 'shared/expense';
import { CategoryMap, ObjectId } from 'shared/types';
import { Money } from 'shared/util';

import { getRootCategoryId } from '../utils/Categories';
import { RecurrenceTotals, SubscriptionGroup } from './types';

const emptyTotals: () => RecurrenceTotals = () => ({
  recurrencePerMonth: 0,
  recurrencePerYear: 0,
});

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
        : { root: categories[rootCat], children: [], allTotals: emptyTotals() };
    byRoot[rootCat] = group;
    if (rootCat === item.categoryId) {
      group.rootItems = (group.rootItems ?? []).concat(item);
      group.rootTotals = group.rootTotals ?? {
        recurrencePerMonth: Money.from(0),
        recurrencePerYear: Money.from(0),
      };
      group.rootTotals = appendToTotals(group.rootTotals, item);
    } else {
      let cat = group.children.find(c => c.category.id === item.categoryId);
      if (!cat) {
        cat = {
          category: categories[item.categoryId],
          items: [],
          totals: emptyTotals(),
        };
        group.children.push(cat);
      }
      cat.items.push(item);
      cat.totals = appendToTotals(cat.totals, item);
    }
  }
  return Object.values(byRoot).map(g => ({
    ...g,
    allTotals: g.children.reduce(
      (p, c) => appendToTotals(p, c.totals),
      emptyTotals()
    ),
  }));
}

function appendToTotals(
  totals: RecurrenceTotals,
  item: RecurrenceTotals
): RecurrenceTotals {
  return {
    recurrencePerMonth: Money.from(totals.recurrencePerMonth).plus(
      item.recurrencePerMonth
    ),
    recurrencePerYear: Money.from(totals.recurrencePerYear).plus(
      item.recurrencePerYear
    ),
  };
}
