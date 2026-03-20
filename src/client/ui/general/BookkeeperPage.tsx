import { AppShell, Container, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { Session } from 'shared/types';
import { expenseDialogE, expenseSplitE } from 'client/data/State';
import {
  categoryPagePath,
  categoryViewMonthPattern,
  categoryViewYearPattern,
  expenseMonthPathPattern,
  expensePagePath,
  groupingsPagePath,
  infoPagePath,
  profilePagePath,
  searchPagePath,
  shortcutsPagePath,
  statisticsPage,
  subscriptionsPagePath,
  toolsPagePath,
  trackingPagePath,
} from 'client/util/Links';

import { RoutedCategoryView } from '../category/RoutedCategoryView';
import { neutral } from '../Colors';
import MenuDrawer from '../component/MenuDrawer';
import { NotificationBar } from '../component/NotificationBar';
import { appLinks, TopBar } from '../component/TopBar';
import { ModalDialogConnector } from '../dialog/ModalDialogConnector';
import { ExpenseDialog } from '../expense/dialog/ExpenseDialog';
import { createExpenseDialogListener } from '../expense/dialog/ExpenseDialogListener';
import { FrontpageView } from '../expense/FrontpageView';
import { RoutedMonthView } from '../expense/RoutedMonthView';
import { ExpenseSplitDialog } from '../expense/split/ExpenseSplitDialog';
import { GroupingExpensesPage } from '../grouping/GroupingExpensesPage';
import { GroupingPage } from '../grouping/GroupingPage';
import { InfoView } from '../info/InfoView';
import { ProfileView } from '../profile/ProfileView';
import { SearchPage } from '../search/SearchPage';
import { StatisticsView } from '../statistics/StatisticsView';
import { mainContentMaxWidth, Size } from '../Styles';
import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage';
import { ToolsView } from '../tools/ToolsView';
import { TrackingPage } from '../tracking/TrackingPage';
import { PathNotFoundError } from './ErrorView';
import { ShortcutsPage } from './ShortcutsPage';

interface PageProps {
  session: Session;
  windowSize: Size;
}

const ExpenseDialogBinder = createExpenseDialogListener(ExpenseDialog, expenseDialogE);

const ExpenseSplitBinder = createExpenseDialogListener(ExpenseSplitDialog, expenseSplitE);

export const BookkeeperPage: React.FC<PageProps> = ({ windowSize }) => {
  const [menuOpen, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);

  return (
    <>
      <ExpenseDialogBinder windowSize={windowSize} />
      <ExpenseSplitBinder windowSize={windowSize} />
      <ModalDialogConnector />
      <Router>
        <AppShell header={{ height: 56 }} padding={{ base: 0, sm: 'md' }} bg={neutral[1]}>
          <AppShell.Header bg={neutral[4]}>
            <TopBar windowSize={windowSize} menuOpen={menuOpen} onToggleMenu={toggleMenu} />
          </AppShell.Header>

          <AppShell.Main style={{ display: 'flex', flexDirection: 'column' }}>
            <Container
              size={mainContentMaxWidth}
              p={0}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <Paper
                shadow="md"
                bg="var(--mantine-color-default)"
                flex={1}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <Routes>
                  <Route
                    path={expenseMonthPathPattern('date') + '/*'}
                    element={<RoutedMonthView />}
                  />
                  <Route path={expensePagePath + '/*'} element={<RoutedMonthView />} />
                  <Route path={categoryViewYearPattern('year')} element={<RoutedCategoryView />} />
                  <Route
                    path={categoryViewMonthPattern('month')}
                    element={<RoutedCategoryView />}
                  />
                  <Route path={shortcutsPagePath + '/*'} element={<ShortcutsPage />} />
                  <Route path={subscriptionsPagePath} element={<SubscriptionsPage />} />
                  <Route path={categoryPagePath} element={<RoutedCategoryView />} />
                  <Route path={`${searchPagePath}/m/:month`} element={<SearchPage />} />
                  <Route path={`${searchPagePath}/y/:year`} element={<SearchPage />} />
                  <Route path={searchPagePath} element={<SearchPage />} />
                  <Route path={statisticsPage} element={<StatisticsView />} />
                  <Route path={profilePagePath + '/*'} element={<ProfileView />} />
                  <Route path={infoPagePath} element={<InfoView />} />
                  <Route path={trackingPagePath} element={<TrackingPage />} />
                  <Route path={groupingsPagePath} element={<GroupingPage />} />
                  <Route
                    path={`${groupingsPagePath}/:groupingId`}
                    element={<GroupingExpensesPage />}
                  />
                  <Route path={toolsPagePath} element={<ToolsView />} />
                  <Route path={'/p/*'} element={<FrontpageView />} />
                  <Route path="/" element={<FrontpageView />} />
                  <Route element={<PathNotFoundError />} />
                </Routes>
              </Paper>
            </Container>
          </AppShell.Main>
        </AppShell>
        <MenuDrawer
          open={menuOpen}
          onRequestChange={open => (open ? undefined : closeMenu())}
          links={appLinks}
        />
      </Router>
      <NotificationBar />
    </>
  );
};
