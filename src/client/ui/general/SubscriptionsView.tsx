import * as React from 'react';
import styled from 'styled-components';

import { RecurringExpense } from 'shared/expense';
import apiConnect from 'client/data/ApiConnect';

import { AsyncDataView } from '../component/AsyncDataView';
import { useAsyncData } from '../hooks/useAsyncData';
import { PageContentContainer } from '../Styles';

const loadExpenses = () => apiConnect.getRecurringExpenses();

export const SubscriptionsView: React.FC = () => {
  const data = useAsyncData(loadExpenses, true);
  return (
    <PageContentContainer>
      <SubscriptionsContainer>
        <AsyncDataView data={data} renderer={SubscriptionsRenderer} />
      </SubscriptionsContainer>
    </PageContentContainer>
  );
};

const SubscriptionsRenderer: React.FC<{ data: RecurringExpense[] }> = ({
  data,
}) => {
  console.log('DATA', data);
  return (
    <>
      {data.map(d => (
        <Subscription key={d.id} item={d} />
      ))}
    </>
  );
};

const Subscription: React.FC<{ item: RecurringExpense }> = ({ item }) => (
  <SubRow>
    <>
      {item.title} {item.sum}
    </>
  </SubRow>
);

const SubRow = styled.div``;

const SubscriptionsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 24px;
  flex-direction: column;
`;
