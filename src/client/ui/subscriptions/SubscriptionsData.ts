import { Subscription, SubscriptionResult } from 'shared/expense';
import { CategoryMap, ObjectId } from 'shared/types';
import { Money } from 'shared/util';

import { getRootCategoryId } from '../utils/Categories';
import { RecurrenceTotals, SubscriptionGroup, SubscriptionsData } from './types';

const emptyTotals: () => RecurrenceTotals = () => ({
  recurrencePerMonth: 0,
  recurrencePerYear: 0,
});

export function groupSubscriptions(
  result: SubscriptionResult,
  categories: CategoryMap,
): SubscriptionsData {
  const byRoot: Record<ObjectId, SubscriptionGroup> = {};
  for (const item of result) {
    const rootCat = getRootCategoryId(item.categoryId, categories);
    const group: SubscriptionGroup =
      rootCat in byRoot
        ? byRoot[rootCat]
        : {
            root: categories[rootCat],
            children: [],
            allTotals: emptyTotals(),
            colorIndex: 0,
          };
    byRoot[rootCat] = group;
    if (rootCat === item.categoryId) {
      group.rootItems = (group.rootItems ?? []).concat(item);
      group.rootTotals = group.rootTotals ?? emptyTotals();
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
  const groups = Object.values(byRoot).map((g, i) => ({
    ...g,
    // Rewrite colorIndices here
    colorIndex: i,
    allTotals: sumRecurrenceTotals([
      ...g.children.map(c => c.totals),
      ...(g.rootTotals ? [g.rootTotals] : []),
    ]),
  }));
  return {
    groups,
    totals: sumRecurrenceTotals(groups.map(g => g.allTotals)),
  };
}

function appendToTotals(totals: RecurrenceTotals, item: Subscription): RecurrenceTotals {
  return {
    recurrencePerMonth: Money.from(totals.recurrencePerMonth).plus(item.recurrencePerMonth),
    recurrencePerYear: Money.from(totals.recurrencePerYear).plus(item.recurrencePerYear),
  };
}

export function sumRecurrenceTotals(data: RecurrenceTotals[]): RecurrenceTotals {
  return data.reduce(
    (p, c) => ({
      recurrencePerMonth: Money.from(p.recurrencePerMonth).plus(c.recurrencePerMonth),
      recurrencePerYear: Money.from(p.recurrencePerYear).plus(c.recurrencePerYear),
    }),
    emptyTotals(),
  );
}
