import * as React from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';

import { shortcutToExpenseInEditor } from 'shared/expense';
import { toDateTime } from 'shared/time';
import { validSessionP } from 'client/data/Login';
import { updateExpenses } from 'client/data/State';
import { logger } from 'client/Logger';
import { useBaconState } from 'client/ui/hooks/useBaconState';
import { useIsMobile } from 'client/ui/hooks/useBreakpoints';
import { useQueryParams } from 'client/ui/hooks/useQueryParams';
import { navigateAndWait } from 'client/ui/utils/Navigation';
import { newExpenseSuffix } from 'client/util/Links';

import { ExpenseDialog } from './ExpenseDialog';
import { expenseDialogDataP } from './ExpenseDialogSessionData';

const NewExpenseDialogPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const params = useQueryParams();
  const date = params.date ? toDateTime(params.date) : undefined;
  const data = useBaconState(expenseDialogDataP);
  if (!data) return null;

  return (
    <ExpenseDialog
      {...data}
      createNew
      values={{ date }}
      onClose={async () => {
        logger.info('Closing new expense dialog, navigating back');
        await navigateAndWait(() => navigate(-1));
      }}
      original={null}
      saveAction={null}
      isMobile={isMobile}
      title="Uusi kirjaus"
      onExpensesUpdated={updateExpenses}
      expenseCounter={1}
    />
  );
};

const NewExpenseFromShortcutDialogPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { shortcutId } = useParams<'shortcutId'>();
  const id = Number(shortcutId);
  const data = useBaconState(expenseDialogDataP);
  const session = useBaconState(validSessionP);

  React.useEffect(() => {
    if (session && !session.shortcuts.find(s => s.id === id)) {
      logger.warn(`Shortcut ${id} not found, backing out`);
      navigate(-1);
    }
  }, [session, navigate, id]);

  if (!data || !session) return null;

  const shortcut = session.shortcuts.find(s => s.id === id);
  const values = shortcut ? shortcutToExpenseInEditor(shortcut.expense) : {};
  logger.info(values, 'Opening expense editor');

  return (
    <ExpenseDialog
      {...data}
      createNew
      values={values}
      onClose={async () => {
        logger.info('Closing new expense from shortcut dialog, navigating back');
        await navigateAndWait(() => navigate(-1));
      }}
      original={null}
      saveAction={null}
      isMobile={isMobile}
      title="Uusi kirjaus"
      onExpensesUpdated={updateExpenses}
      expenseCounter={1}
    />
  );
};

export const NewExpenseDialogRoutes: React.FC = () => (
  <Routes>
    <Route
      path={newExpenseSuffix + '/:shortcutId'}
      element={<NewExpenseFromShortcutDialogPage />}
    />
    <Route path={newExpenseSuffix} element={<NewExpenseDialogPage />} />
  </Routes>
);
