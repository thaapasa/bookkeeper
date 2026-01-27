import * as B from 'baconjs';
import * as React from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';

import { shortcutToExpenseInEditor } from 'shared/expense';
import { toDateTime } from 'shared/time';
import { Session } from 'shared/types';
import { categoryDataSourceP, categoryMapP } from 'client/data/Categories';
import { sourceMapP, validSessionP } from 'client/data/Login';
import { updateExpenses } from 'client/data/State';
import { logger } from 'client/Logger';
import { connect } from 'client/ui/component/BaconConnect';
import { useQueryParams } from 'client/ui/hooks/useQueryParams';
import { useWindowSize } from 'client/ui/hooks/useWindowSize';
import { navigateAndWait } from 'client/ui/utils/Navigation';
import { newExpenseSuffix } from 'client/util/Links';

import { ExpenseDialog } from './ExpenseDialog';

const ConnectedExpenseDialog = connect(
  B.combineTemplate({
    sources: validSessionP.map(s => s.sources),
    categories: validSessionP.map(s => s.categories),
    user: validSessionP.map(s => s.user),
    group: validSessionP.map(s => s.group),
    sourceMap: sourceMapP,
    categorySource: categoryDataSourceP,
    categoryMap: categoryMapP,
    groupings: validSessionP.map(s => s.groupings),
    users: validSessionP.map(s => s.users),
  }),
)(ExpenseDialog);

const NewExpenseDialogPage: React.FC = () => {
  const navigate = useNavigate();
  const windowSize = useWindowSize();
  const params = useQueryParams();
  const date = params.date ? toDateTime(params.date) : undefined;
  return (
    <ConnectedExpenseDialog
      createNew
      values={{ date }}
      onClose={async () => {
        logger.info('Closing new expense dialog, navigating back');
        await navigateAndWait(() => navigate(-1));
      }}
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
      logger.warn(`Shortcut ${id} not found, backing out`);
      navigate(-1);
    }
  }, [shortcut, navigate, id]);
  const values = shortcut ? shortcutToExpenseInEditor(shortcut.expense) : {};
  logger.info(values, 'Opening expense editor');
  return (
    <ConnectedExpenseDialog
      createNew
      values={values}
      onClose={async () => {
        logger.info('Closing new expense from shortcut dialog, navigating back');
        await navigateAndWait(() => navigate(-1));
      }}
      original={null}
      saveAction={null}
      windowSize={windowSize}
      title="Uusi kirjaus"
      onExpensesUpdated={updateExpenses}
      expenseCounter={1}
    />
  );
};

const ConnectedShortcutDialogPage = connect(B.combineTemplate({ session: validSessionP }))(
  NewExpenseFromShortcutDialogPage,
);

export const NewExpenseDialogRoutes: React.FC = () => (
  <Routes>
    <Route path={newExpenseSuffix + '/:shortcutId'} element={<ConnectedShortcutDialogPage />} />
    <Route path={newExpenseSuffix} element={<NewExpenseDialogPage />} />
  </Routes>
);
