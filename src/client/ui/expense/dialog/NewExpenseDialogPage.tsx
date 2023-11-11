import * as B from 'baconjs';
import * as React from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

import { categoryDataSourceP, categoryMapE } from 'client/data/Categories';
import { sourceMapE, validSessionE } from 'client/data/Login';
import { updateExpenses } from 'client/data/State';
import { connect } from 'client/ui/component/BaconConnect';
import { useWindowSize } from 'client/ui/hooks/useWindowSize';
import { Size } from 'client/ui/Types';
import { newExpenseSuffix } from 'client/util/Links';

import { ExpenseDialog } from './ExpenseDialog';

const ConnectedExpenseDialog = connect(
  B.combineTemplate({
    sources: validSessionE.map(s => s.sources),
    categories: validSessionE.map(s => s.categories),
    user: validSessionE.map(s => s.user),
    group: validSessionE.map(s => s.group),
    sourceMap: sourceMapE,
    categorySource: categoryDataSourceP,
    categoryMap: categoryMapE,
    users: validSessionE.map(s => s.users),
  }),
)(ExpenseDialog);

export const NewExpenseDialogPage: React.FC<{ windowSize: Size }> = ({ windowSize }) => {
  const navigate = useNavigate();
  return (
    <ConnectedExpenseDialog
      createNew
      values={{}}
      onClose={() => navigate(-1)}
      original={null}
      saveAction={null}
      windowSize={windowSize}
      title="Uusi kirjaus"
      onExpensesUpdated={updateExpenses}
      expenseCounter={1}
    />
  );
};

export const NewExpenseDialogRoutes: React.FC = () => {
  const windowSize = useWindowSize();
  return (
    <Routes>
      <Route path={newExpenseSuffix} element={<NewExpenseDialogPage windowSize={windowSize} />} />
    </Routes>
  );
};
