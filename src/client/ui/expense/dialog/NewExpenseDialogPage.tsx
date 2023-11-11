import * as B from 'baconjs';
import * as React from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';

import { shortcutToExpenseInEditor } from 'shared/expense';
import { Session } from 'shared/types';
import { categoryDataSourceP, categoryMapE } from 'client/data/Categories';
import { sourceMapE, validSessionE } from 'client/data/Login';
import { updateExpenses } from 'client/data/State';
import { connect } from 'client/ui/component/BaconConnect';
import { useWindowSize } from 'client/ui/hooks/useWindowSize';
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

const NewExpenseDialogPage: React.FC = () => {
  const navigate = useNavigate();
  const windowSize = useWindowSize();
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

const NewExpenseFromShortcutDialogPage: React.FC<{ session: Session }> = ({ session }) => {
  const navigate = useNavigate();
  const windowSize = useWindowSize();
  const { shortcutId } = useParams<'shortcutId'>();
  const id = Number(shortcutId);
  const shortcut = session.shortcuts.find(s => s.id === id);
  React.useEffect(() => {
    if (!shortcut) {
      navigate(-1);
    }
  }, [shortcut, navigate]);
  const values = shortcut ? shortcutToExpenseInEditor(shortcut.expense) : {};
  return (
    <ConnectedExpenseDialog
      createNew
      values={values}
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

const ConnectedShortcutDialogPage = connect(B.combineTemplate({ session: validSessionE }))(
  NewExpenseFromShortcutDialogPage,
);

export const NewExpenseDialogRoutes: React.FC = () => (
  <Routes>
    <Route path={newExpenseSuffix + '/:shortcutId'} element={<ConnectedShortcutDialogPage />} />
    <Route path={newExpenseSuffix} element={<NewExpenseDialogPage />} />
  </Routes>
);
