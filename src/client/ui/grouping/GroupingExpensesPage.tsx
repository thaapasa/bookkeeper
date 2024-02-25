import styled from '@emotion/styled';
import * as B from 'baconjs';
import React from 'react';
import { useParams } from 'react-router';

import { ExpenseGroupingWithExpenses } from 'shared/types';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { needUpdateE } from 'client/data/State';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { Subtitle } from '../design/Text';
import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { useAsyncData } from '../hooks/useAsyncData';
import { useForceReload } from '../hooks/useForceReload';
import { TotalsView } from '../search/TotalsView';
import { PageContentContainer } from '../Styles';
import { GroupingCategoryChart } from './GroupingCategoryChart';

export const GroupingExpensesPage: React.FC = () => {
  const { counter, forceReload } = useForceReload();
  const { groupingId } = useParams<'groupingId'>();
  const expenses = useAsyncData(loadExpenses, !!groupingId, Number(groupingId), counter);
  React.useEffect(() => needUpdateE.onValue(forceReload), [forceReload]);
  return (
    <PageContentContainer className="center">
      <AsyncDataView
        data={expenses}
        renderer={ConnectedGroupingExpensesRenderer}
        reloadExpenses={forceReload}
      />
    </PageContentContainer>
  );
};

const loadExpenses = (groupingId: number, _counter: number) =>
  apiConnect.getExpenseGroupingWithExpenses(Number(groupingId));

const GroupingExpensesRenderer: React.FC<{
  data: ExpenseGroupingWithExpenses;
  userData: UserDataProps;
  reloadExpenses: () => void;
}> = ({ data, userData, reloadExpenses }) => (
  <CenterArea>
    <TitleRow>{data.title}</TitleRow>
    <GroupingCategoryChart totals={data.categoryTotals} />
    <ExpenseTableLayout className="padding">
      <tbody>
        {data.expenses?.map(expense => (
          <ExpenseRow
            expense={expense}
            userData={userData}
            key={'expense-row-' + expense.id}
            addFilter={noop}
            onUpdated={reloadExpenses}
          />
        ))}
      </tbody>
    </ExpenseTableLayout>
    <TotalsView results={data.expenses} />
  </CenterArea>
);

const CenterArea = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TitleRow = styled(Subtitle)`
  width: 100%;
  padding: 8px;
  text-align: center;
`;

const ConnectedGroupingExpensesRenderer = connect(B.combineTemplate({ userData: userDataE }))(
  GroupingExpensesRenderer,
);
