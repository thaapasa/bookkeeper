import * as React from 'react';
import { Route, Routes } from 'react-router';

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

import { RoutedCategoryView } from '../category/RoutedCategoryView.tsx';
import { FrontpageView } from '../expense/FrontpageView.tsx';
import { RoutedMonthView } from '../expense/RoutedMonthView.tsx';
import { PathNotFoundError } from '../general/ErrorView.tsx';
import { ShortcutsPage } from '../general/ShortcutsPage.tsx';
import { GroupingExpensesPage } from '../grouping/GroupingExpensesPage.tsx';
import { GroupingPage } from '../grouping/GroupingPage.tsx';
import { InfoView } from '../info/InfoView.tsx';
import { ProfileView } from '../profile/ProfileView.tsx';
import { SearchPage } from '../search/SearchPage.tsx';
import { StatisticsView } from '../statistics/StatisticsView';
import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage';
import { ToolsView } from '../tools/ToolsView.tsx';
import { TrackingPage } from '../tracking/TrackingPage';

export function AppRouter() {
  return (
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
      <Route path={groupingsPagePath} element={<GroupingPage />} />
      <Route path={`${groupingsPagePath}/:groupingId`} element={<GroupingExpensesPage />} />
      <Route path={toolsPagePath} element={<ToolsView />} />
      <Route path={'/p/*'} element={<FrontpageView />} />
      <Route path="/" element={<FrontpageView />} />
      <Route element={<PathNotFoundError />} />
    </Routes>
  );
}
