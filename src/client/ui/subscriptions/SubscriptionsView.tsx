import { combineTemplate } from 'baconjs';
import * as React from 'react';

import { RecurringExpense } from 'shared/expense';
import { Category, CategoryMap } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE } from 'client/data/Categories';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { useAsyncData } from '../hooks/useAsyncData';
import { PageContentContainer } from '../Styles';
import {
  SubscriptionCategoryHeader,
  SubscriptionItem,
} from './SubscriptionItem';
import { groupSubscriptions } from './SubscriptionsData';
import { RecurrenceTotals, SubscriptionGroup } from './types';

const loadExpenses = async (categories: CategoryMap) =>
  groupSubscriptions(
    await apiConnect.searchRecurringExpenses({ type: 'expense' }),
    categories
  );

const SubscriptionsViewImpl: React.FC<{
  categories: CategoryMap;
}> = ({ categories }) => {
  const data = useAsyncData(loadExpenses, true, categories);
  return (
    <PageContentContainer>
      <AsyncDataView data={data} renderer={SubscriptionsRenderer} />
    </PageContentContainer>
  );
};

export const SubscriptionsView = connect(
  combineTemplate({ categories: categoryMapE })
)(SubscriptionsViewImpl);

const SubscriptionsRenderer: React.FC<{
  data: SubscriptionGroup[];
}> = ({ data }) => (
  <>
    {data.map(s => (
      <GroupView key={s.root.id} group={s} />
    ))}
  </>
);

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
