import { combineTemplate } from 'baconjs';
import * as React from 'react';
import styled from 'styled-components';

import { RecurringExpense } from 'shared/expense';
import { Category, CategoryMap } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { categoryMapE } from 'client/data/Categories';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { NoteView } from '../general/NoteView';
import { useAsyncData } from '../hooks/useAsyncData';
import { PageContentContainer } from '../Styles';
import { groupSubscriptions } from './SubscriptionData';
import { SubscriptionItem } from './SubscriptionItem';
import { SubscriptionGroup } from './SubscriptionTypes';

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
      <SubscriptionsContainer>
        <AsyncDataView data={data} renderer={SubscriptionsRenderer} />
      </SubscriptionsContainer>
    </PageContentContainer>
  );
};

export const SubscriptionsView = connect(
  combineTemplate({ categories: categoryMapE })
)(SubscriptionsViewImpl);

const SubscriptionsRenderer: React.FC<{
  data: SubscriptionGroup[];
}> = ({ data }) => {
  console.log('DATA', data);
  return (
    <>
      {data.map(s => (
        <GroupView key={s.root.id} group={s} />
      ))}
    </>
  );
};

const GroupView: React.FC<{ group: SubscriptionGroup }> = ({
  group: { root, rootItems, children },
}) => (
  <NoteView title={root.name} fullWidth compact>
    {rootItems ? (
      <CategorySubscriptions category={root} items={rootItems} />
    ) : null}
    {children.map(c => (
      <CategorySubscriptions
        key={c.category.id}
        category={c.category}
        items={c.items}
      />
    ))}
  </NoteView>
);

const CategorySubscriptions: React.FC<{
  category: Category;
  items: RecurringExpense[];
}> = ({ category, items }) => (
  <>
    <h3>{category.name}</h3>
    {items.map(item => (
      <SubscriptionItem key={item.id} item={item} />
    ))}
  </>
);

const SubscriptionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  flex-direction: column;
`;
