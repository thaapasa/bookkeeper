import { combineTemplate } from 'baconjs';
import * as React from 'react';

import { RecurringExpense, RecurringExpenseCriteria } from 'shared/expense';
import { Category, CategoryMap, ObjectId } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE } from 'client/data/Categories';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { useAsyncData } from '../hooks/useAsyncData';
import { PageContentContainer } from '../Styles';
import { SubscriptionCriteriaSelector } from './SubscriptionCriteriaSelector';
import {
  SubscriptionCategoryHeader,
  SubscriptionItem,
} from './SubscriptionItem';
import { groupSubscriptions } from './SubscriptionsData';
import { TotalsChart, TotalsData } from './TotalsChart';
import {
  RecurrenceTotals,
  SubscriptionGroup,
  SubscriptionsData,
} from './types';

const loadExpenses = async (
  criteria: RecurringExpenseCriteria,
  categories: CategoryMap
) =>
  groupSubscriptions(
    await apiConnect.searchRecurringExpenses(criteria),
    categories
  );

const SubscriptionsViewImpl: React.FC<{
  categories: CategoryMap;
}> = ({ categories }) => {
  const [criteria, setCriteria] = React.useState<RecurringExpenseCriteria>({});
  const data = useAsyncData(loadExpenses, true, criteria, categories);
  return (
    <PageContentContainer>
      <SubscriptionCriteriaSelector onChange={setCriteria} />
      <AsyncDataView data={data} renderer={SubscriptionsRenderer} />
    </PageContentContainer>
  );
};

export const SubscriptionsView = connect(
  combineTemplate({ categories: categoryMapE })
)(SubscriptionsViewImpl);

const SubscriptionsRenderer: React.FC<{
  data: SubscriptionsData;
}> = ({ data }) => {
  const [catId, setCatId] = React.useState<ObjectId | undefined>(undefined);
  const pieData = createPieData(data.groups, catId);
  const selectedIndex = data.groups.findIndex(g => g.root.id === catId);
  const selectedGroup =
    selectedIndex >= 0 ? data.groups[selectedIndex] : undefined;
  return (
    <>
      <SubscriptionCategoryHeader
        title="Kaikki"
        totals={data.totals}
        className="root-category"
      />
      <TotalsChart
        data={pieData}
        onSelectCategory={setCatId}
        colorIndex={selectedIndex >= 0 ? selectedIndex : undefined}
      />
      {selectedGroup ? (
        <GroupView group={selectedGroup} />
      ) : (
        data.groups.map(s => <GroupView key={s.root.id} group={s} />)
      )}
    </>
  );
};

function createPieData(
  groups: SubscriptionGroup[],
  selectedCat?: ObjectId
): TotalsData[] {
  if (!selectedCat) {
    return groups.map(g =>
      total(g.root.name, g.allTotals.recurrencePerYear, g.root.id)
    );
  }
  const group = groups.find(g => g.root.id === selectedCat);
  if (!group) return [];
  return (
    group.rootTotals
      ? [total(group.root.name, group.rootTotals.recurrencePerYear)]
      : []
  ).concat(
    group.children.map(c => total(c.category.name, c.totals.recurrencePerYear))
  );
}

function total(
  name: string,
  sum: MoneyLike,
  categoryId?: ObjectId
): TotalsData {
  return { name, sum: Money.from(sum).valueOf(), categoryId };
}

const GroupView: React.FC<{ group: SubscriptionGroup }> = ({
  group: { root, rootItems, rootTotals, allTotals, children },
}) => (
  <>
    <SubscriptionCategoryHeader
      title={root.name}
      totals={allTotals}
      className="root-category"
    />
    {rootItems ? (
      <CategorySubscriptions
        category={root}
        title="Pääkategorian kirjaukset"
        items={rootItems}
        totals={rootTotals}
      />
    ) : null}
    {children.map(c => (
      <CategorySubscriptions
        key={c.category.id}
        category={c.category}
        items={c.items}
        totals={c.totals}
      />
    ))}
  </>
);

const CategorySubscriptions: React.FC<{
  category: Category;
  title?: string;
  items: RecurringExpense[];
  totals?: RecurrenceTotals;
}> = ({ category, items, totals, title }) => (
  <>
    <SubscriptionCategoryHeader
      title={title ?? category.name}
      totals={totals}
      className="child-category"
    />
    {items.map(item => (
      <SubscriptionItem key={item.id} item={item} />
    ))}
  </>
);
