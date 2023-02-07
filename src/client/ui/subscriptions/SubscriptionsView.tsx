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
import { useForceReload } from '../hooks/useForceReload';
import { PageContentContainer } from '../Styles';
import { SubscriptionCriteriaSelector } from './SubscriptionCriteriaSelector';
import {
  SubscriptionCategoryHeader,
  SubscriptionItem,
  ToggleCategoryVisibility,
} from './SubscriptionItem';
import { groupSubscriptions, sumRecurrenceTotals } from './SubscriptionsData';
import { TotalsChart, TotalsData } from './TotalsChart';
import {
  RecurrenceTotals,
  SubscriptionGroup,
  SubscriptionsData,
} from './types';

const loadExpenses = async (
  criteria: RecurringExpenseCriteria | undefined,
  categories: CategoryMap
) =>
  groupSubscriptions(
    criteria ? await apiConnect.searchRecurringExpenses(criteria) : [],
    categories
  );

const SubscriptionsViewImpl: React.FC<{
  categories: CategoryMap;
}> = ({ categories }) => {
  const [criteria, setCriteria] = React.useState<
    RecurringExpenseCriteria | undefined
  >(undefined);
  const data = useAsyncData(
    loadExpenses,
    criteria !== undefined,
    criteria,
    categories
  );
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
  const hidden = React.useMemo(() => new Set<ObjectId>(), []);
  const forceReload = useForceReload();
  const setVisibility = React.useCallback<ToggleCategoryVisibility>(
    (visible, id) => {
      if (visible) hidden.delete(id);
      else hidden.add(id);
      forceReload();
    },
    [hidden, forceReload]
  );
  const filteredGroups = data.groups.filter(g => !hidden.has(g.root.id));
  const pieData = createPieData(filteredGroups, catId);
  const selectedIndex = data.groups.findIndex(g => g.root.id === catId);
  const selectedGroup =
    selectedIndex >= 0 ? data.groups[selectedIndex] : undefined;

  const hasFiltered = filteredGroups.length !== data.groups.length;

  return (
    <>
      <SubscriptionCategoryHeader
        title={hasFiltered ? 'Suodatetut' : 'Kaikki'}
        totals={
          hasFiltered
            ? sumRecurrenceTotals(filteredGroups.map(g => g.allTotals))
            : data.totals
        }
        className="root-category"
      />
      <TotalsChart
        data={pieData}
        onSelectCategory={setCatId}
        colorIndex={selectedIndex >= 0 ? selectedIndex : undefined}
      />
      {selectedGroup ? (
        <GroupView
          group={selectedGroup}
          hidden={hidden}
          setVisibility={setVisibility}
        />
      ) : (
        data.groups.map(s => (
          <GroupView
            key={s.root.id}
            group={s}
            hidden={hidden}
            setVisibility={setVisibility}
          />
        ))
      )}
    </>
  );
};

function createPieData(
  groups: SubscriptionGroup[],
  selectedCat: ObjectId | undefined
): TotalsData[] {
  if (!selectedCat) {
    return groups.map(g =>
      total(g.root.name, g.allTotals.recurrencePerYear, g.colorIndex, g.root.id)
    );
  }
  const group = groups.find(g => g.root.id === selectedCat);
  if (!group) return [];
  return (
    group.rootTotals
      ? [
          total(
            group.root.name,
            group.rootTotals.recurrencePerYear,
            group.colorIndex
          ),
        ]
      : []
  ).concat(
    group.children.map(c =>
      total(c.category.name, c.totals.recurrencePerYear, group.colorIndex)
    )
  );
}

function total(
  name: string,
  sum: MoneyLike,
  colorIndex: number,
  categoryId?: ObjectId
): TotalsData {
  return { name, sum: Money.from(sum).valueOf(), categoryId, colorIndex };
}

const GroupView: React.FC<{
  group: SubscriptionGroup;
  hidden: Set<ObjectId>;
  setVisibility: ToggleCategoryVisibility;
}> = ({
  group: { root, rootItems, rootTotals, allTotals, children },
  hidden,
  setVisibility,
}) => {
  return (
    <>
      <SubscriptionCategoryHeader
        title={root.name}
        totals={allTotals}
        className="root-category"
        categoryId={root.id}
        visible={!hidden.has(root.id)}
        setVisible={setVisibility}
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
};

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
