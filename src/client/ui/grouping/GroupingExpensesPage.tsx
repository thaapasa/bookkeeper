import * as B from 'baconjs';
import React from 'react';
import { useParams } from 'react-router';

import { ExpenseGroupingWithExpenses } from 'shared/types';
import { noop } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { ExpenseRow } from '../expense/row/ExpenseRow';
import { ExpenseTableLayout } from '../expense/row/ExpenseTableLayout';
import { useAsyncData } from '../hooks/useAsyncData';
import { PageContentContainer } from '../Styles';

export const GroupingExpensesPage: React.FC = () => {
  const { groupingId } = useParams<'groupingId'>();
  const expenses = useAsyncData(
    apiConnect.getExpenseGroupingWithExpenses,
    !!groupingId,
    Number(groupingId),
  );
  return (
    <PageContentContainer className="center">
      <AsyncDataView data={expenses} renderer={ConnectedGroupingExpensesRenderer} />
    </PageContentContainer>
  );
};

const GroupingExpensesRenderer: React.FC<{
  data: ExpenseGroupingWithExpenses;
  userData: UserDataProps;
}> = ({ data, userData }) => (
  <>
    <div>{data.title}</div>
    <ExpenseTableLayout className="padding">
      <tbody>
        {data.expenses?.map(expense => (
          <ExpenseRow
            expense={expense}
            userData={userData}
            key={'expense-row-' + expense.id}
            addFilter={noop}
            onUpdated={noop}
          />
        ))}
      </tbody>
    </ExpenseTableLayout>
  </>
);

const ConnectedGroupingExpensesRenderer = connect(B.combineTemplate({ userData: userDataE }))(
  GroupingExpensesRenderer,
);
