import styled from '@emotion/styled';
import { AppShell, Burger, Group } from '@mantine/core';
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
import { colorScheme } from '../Colors';
import { NotificationBar } from '../component/NotificationBar';
import { AppLink, LinkButton } from '../component/TopBar';
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
import { isMobileSize, mainContentMargin, mainContentMaxWidth, media } from '../Styles';
import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage';
import { ToolsView } from '../tools/ToolsView';
import { TrackingPage } from '../tracking/TrackingPage';
import { Size } from '../Types';
import { AddExpenseNavButton } from '../icons/AddExpenseIcon';
import { DateRangeNavigator } from '../component/DateRangeNavigator';
import MenuDrawer from '../component/MenuDrawer';
import { ShortcutsDropdown } from '../shortcuts/ShortcutsDropdown';
import { PathNotFoundError } from './ErrorView';
import { ShortcutsPage } from './ShortcutsPage';

interface PageProps {
  session: Session;
  windowSize: Size;
}

const appLinks: AppLink[] = [
  {
    label: 'Linkit',
    path: shortcutsPagePath,
    showInHeader: false,
    icon: 'Shortcut',
  },
  {
    label: 'Kulut',
    path: expensePagePath,
    showInHeader: true,
    icon: 'Money',
  },
  {
    label: 'Kategoriat',
    path: categoryPagePath,
    showInHeader: true,
    icon: 'Category',
  },
  {
    label: 'Tilaukset',
    path: subscriptionsPagePath,
    showInHeader: true,
    icon: 'Subscriptions',
  },
  {
    label: 'Tilastot',
    path: statisticsPage,
    showInHeader: 1050,
    icon: 'BarChart',
  },
  { label: 'Seuranta', path: trackingPagePath, showInHeader: true, icon: 'Chart' },
  { label: 'Ryhmittelyt', path: groupingsPagePath, showInHeader: 1200, icon: 'Grouping' },
  { label: 'Haku', path: searchPagePath, showInHeader: true, icon: 'Search' },
  { label: 'Tiedot', path: infoPagePath, showInHeader: false, icon: 'Info' },
  {
    label: 'Työkalut',
    path: toolsPagePath,
    showInHeader: false,
    icon: 'Tools',
  },
];

const ExpenseDialogBinder = createExpenseDialogListener(ExpenseDialog, expenseDialogE);

const ExpenseSplitBinder = createExpenseDialogListener(ExpenseSplitDialog, expenseSplitE);

export const BookkeeperPage: React.FC<PageProps> = ({ windowSize }) => {
  const [menuOpen, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  const isMobile = isMobileSize(windowSize);

  return (
    <>
      <ExpenseDialogBinder windowSize={windowSize} />
      <ExpenseSplitBinder windowSize={windowSize} />
      <ModalDialogConnector />
      <Router>
        <AppShell header={{ height: 48 }} padding={0} bg={colorScheme.gray.light}>
          <AppShell.Header bg={colorScheme.primary.dark}>
            <Group h="100%" px="xs" gap="xs">
              <Burger
                opened={menuOpen}
                onClick={toggleMenu}
                color={colorScheme.primary.text}
                size="sm"
              />
              {isMobile ? (
                <>
                  <Group flex={1} justify="center">
                    <DateRangeNavigator />
                  </Group>
                  <AddExpenseNavButton />
                </>
              ) : (
                <>
                  <Group gap="xs" flex={1}>
                    {appLinks
                      .filter(
                        l =>
                          l.showInHeader === true ||
                          (typeof l.showInHeader === 'number' &&
                            windowSize.width > l.showInHeader),
                      )
                      .map(l => (
                        <LinkButton
                          key={l.label}
                          label={l.label}
                          to={l.path}
                          icon={windowSize.width > 920 ? l.icon : undefined}
                        />
                      ))}
                  </Group>
                  <DateRangeNavigator />
                  <ShortcutsDropdown />
                </>
              )}
            </Group>
          </AppShell.Header>

          <AppShell.Main>
            <MainContent>
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
            </MainContent>
          </AppShell.Main>
        </AppShell>
        <MenuDrawer open={menuOpen} onRequestChange={open => (open ? undefined : closeMenu())} links={appLinks} />
      </Router>
      <NotificationBar />
    </>
  );
};

const MainContent = styled.div`
  margin: ${mainContentMargin}px;
  margin-top: 24px;
  background-color: ${colorScheme.primary.light};
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  min-height: calc(100vh - 48px - 48px);

  ${media.mobile`
    margin: 0;
    box-shadow: none;
  `}

  ${media.largeDevice`
    margin-left: auto;
    margin-right: auto;
    width: ${mainContentMaxWidth}px;
  `}
`;
