import * as React from 'react';
import { Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { shortcutToExpenseInEditor } from 'shared/expense';
import { ISODate, toISODate } from 'shared/time';
import { navigateToExpenseDate } from 'client/data/NavigationStore';
import { invalidateExpenseData } from 'client/data/query';
import { useValidSession } from 'client/data/SessionStore';
import { logger } from 'client/Logger';
import { useIsMobile } from 'client/ui/hooks/useBreakpoints';
import { navigateAndWait } from 'client/ui/utils/Navigation';
import { newExpenseSuffix } from 'client/util/Links';

import { ExpenseDialog } from './ExpenseDialog';

const NewExpenseDialogPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const date: ISODate | undefined = dateParam ? toISODate(dateParam) : undefined;

  return (
    <ExpenseDialog
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
      onExpensesUpdated={date => {
        invalidateExpenseData();
        navigateToExpenseDate(date);
      }}
      expenseCounter={1}
    />
  );
};

const NewExpenseFromShortcutDialogPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const dateOverride: ISODate | undefined = dateParam ? toISODate(dateParam) : undefined;
  const { shortcutId } = useParams<'shortcutId'>();
  const id = Number(shortcutId);
  const session = useValidSession();

  React.useEffect(() => {
    if (!session.shortcuts.find(s => s.id === id)) {
      logger.warn(`Shortcut ${id} not found, backing out`);
      navigate(-1);
    }
  }, [session, navigate, id]);

  const shortcut = session.shortcuts.find(s => s.id === id);
  const values = shortcut ? shortcutToExpenseInEditor(shortcut.expense) : {};
  // URL date param overrides the shortcut's saved date
  if (dateOverride) {
    values.date = dateOverride;
  }
  logger.info(values, 'Opening expense editor');

  return (
    <ExpenseDialog
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
      onExpensesUpdated={date => {
        invalidateExpenseData();
        navigateToExpenseDate(date);
      }}
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
