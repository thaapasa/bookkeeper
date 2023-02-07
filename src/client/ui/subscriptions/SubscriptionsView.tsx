import { Checkbox, FormControlLabel } from '@mui/material';
import { combineTemplate } from 'baconjs';
import * as React from 'react';
import styled from 'styled-components';
import { z } from 'zod';

import { RecurringExpense, RecurringExpenseCriteria } from 'shared/expense';
import { Category, CategoryMap, ObjectId } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE } from 'client/data/Categories';
import { needUpdateE } from 'client/data/State';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { useDeferredData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { useLocalStorage } from '../hooks/useLocalStorage';
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
    criteria ? await apiConnect.searchSubscriptions(criteria) : [],
    categories
  );

const SubscriptionsViewImpl: React.FC<{
  categories: CategoryMap;
}> = ({ categories }) => {
  const [criteria, setCriteria] = React.useState<
    RecurringExpenseCriteria | undefined
  >(undefined);

  const { data, loadData } = useDeferredData(
    loadExpenses,
    criteria !== undefined,
    criteria,
    categories
  );
  // Load data automatically
  React.useEffect(loadData, [loadData, criteria, categories]);
  // Reload whenever update bus is triggered
  React.useEffect(() => needUpdateE.onValue(loadData), [loadData]);
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
  const [perMonth, setPerMonth] = useLocalStorage(
    'subscriptions.show.months',
    false,
    z.boolean()
  );
  const filteredGroups = data.groups.filter(g => !hidden.has(g.root.id));
  const pieData = createPieData(filteredGroups, catId, perMonth);
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
      <ChartArea>
        <TotalsChart
          data={pieData}
          onSelectCategory={setCatId}
          colorIndex={selectedIndex >= 0 ? selectedIndex : undefined}
        />
        <ChartTools>
          <FormControlLabel
            control={
              <Checkbox
                checked={perMonth}
                onChange={() => setPerMonth(!perMonth)}
              />
            }
            label="Kulut per kk"
          />
        </ChartTools>
      </ChartArea>
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
  selectedCat: ObjectId | undefined,
  perMonth: boolean
): TotalsData[] {
  if (!selectedCat) {
    return groups.map(g =>
      total(
        g.root.name,
        g.allTotals.recurrencePerYear,
        g.colorIndex,
        perMonth,
        g.root.id
      )
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
            group.colorIndex,
            perMonth
          ),
        ]
      : []
  ).concat(
    group.children.map(c =>
      total(
        c.category.name,
        c.totals.recurrencePerYear,
        group.colorIndex,
        perMonth
      )
    )
  );
}

const total = (
  name: string,
  sum: MoneyLike,
  colorIndex: number,
  perMonth: boolean,
  categoryId?: ObjectId
): TotalsData => ({
  name,
  sum: Money.from(sum)
    .divide(perMonth ? 12 : 1)
    .valueOf(),
  categoryId,
  colorIndex,
});

const GroupView: React.FC<{
  group: SubscriptionGroup;
  hidden: Set<ObjectId>;
  setVisibility: ToggleCategoryVisibility;
}> = ({
  group: { root, rootItems, rootTotals, allTotals, children },
  hidden,
  setVisibility,
}) => {
  const visible = !hidden.has(root.id);
  return (
    <>
      <SubscriptionCategoryHeader
        title={root.name}
        totals={allTotals}
        className="root-category"
        categoryId={root.id}
        visible={visible}
        setVisible={setVisibility}
      />
      {visible ? (
        <>
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
      ) : null}
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

const ChartArea = styled.div`
  position: relative;
`;

const ChartTools = styled.div`
  position: absolute;
  left: 16px;
  top: 16px;
`;
