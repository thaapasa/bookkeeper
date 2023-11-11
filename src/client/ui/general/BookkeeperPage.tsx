import { styled } from '@mui/material';
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
import { AppLink, NavigationBar } from '../component/NavigationBar';
import { NotificationBar } from '../component/NotificationBar';
import { TopBar } from '../component/TopBar';
import { ModalDialogConnector } from '../dialog/ModalDialogConnector';
import { ExpenseDialog } from '../expense/dialog/ExpenseDialog';
import { createExpenseDialogListener } from '../expense/dialog/ExpenseDialogListener';
import { FrontpageView } from '../expense/FrontpageView';
import { RoutedMonthView } from '../expense/RoutedMonthView';
import { ExpenseSplitDialog } from '../expense/split/ExpenseSplitDialog';
import { InfoView } from '../info/InfoView';
import { ProfileView } from '../profile/ProfileView';
import { SearchPage } from '../search/SearchPage';
import { StatisticsView } from '../statistics/StatisticsView';
import {
  getScreenSizeClassName,
  isMobileSize,
  mainContentMargin,
  mainContentMaxWidth,
} from '../Styles';
import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage';
import { ToolsView } from '../tools/ToolsView';
import { TrackingPage } from '../tracking/TrackingPage';
import { Size } from '../Types';
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
    showInHeader: true,
    icon: 'BarChart',
  },
  { label: 'Seuranta', path: trackingPagePath, showInHeader: true, icon: 'Chart' },
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
  const isMobileDevice = isMobileSize(windowSize);
  const className = getScreenSizeClassName(windowSize);
  return (
    <Page className="bookkeeper-page">
      <ExpenseDialogBinder windowSize={windowSize} />
      <ExpenseSplitBinder windowSize={windowSize} />
      <ModalDialogConnector />
      <Router>
        <ContentContainer>
          <TopBar links={appLinks} windowSize={windowSize} />
          {isMobileDevice ? null : <NavigationBar links={appLinks} windowSize={windowSize} />}
          <MainContent className={'main-content ' + className}>
            <Routes>
              <Route path={expenseMonthPathPattern('date') + '/*'} element={<RoutedMonthView />} />
              <Route path={expensePagePath + '/*'} element={<RoutedMonthView />} />
              <Route path={categoryViewYearPattern('year')} element={<RoutedCategoryView />} />
              <Route path={categoryViewMonthPattern('month')} element={<RoutedCategoryView />} />
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
              <Route path={toolsPagePath} element={<ToolsView />} />
              <Route path={'/p/*'} element={<FrontpageView />} />
              <Route path="/" element={<FrontpageView />} />
              <Route element={<PathNotFoundError />} />
            </Routes>
          </MainContent>
        </ContentContainer>
      </Router>
      <NotificationBar />
    </Page>
  );
};

const Page = styled('div')`
  width: 100%;
  height: 100%;
  background-color: ${colorScheme.gray.light};

  .MuiFormControlLabel-label {
    font-size: 15px;
  }
`;

const ContentContainer = styled('div')`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

const MainContent = styled('div')`
  flex: 1;
  margin: ${mainContentMargin}px;
  margin-top: 40px;
  background-color: ${colorScheme.primary.light};
  box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  &.mobile-portrait,
  &.mobile-landscape {
    margin: 0;
    box-shadow: none;
  }

  &.large {
    margin-left: auto;
    margin-right: auto;
    width: ${mainContentMaxWidth}px;
  }
`;
