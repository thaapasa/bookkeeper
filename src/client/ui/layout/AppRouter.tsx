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

import { RoutedCategoryView } from '../category/RoutedCategoryView';
import { QueryBoundary } from '../component/QueryBoundary';
import { FrontpageView } from '../expense/FrontpageView';
import { RoutedMonthView } from '../expense/RoutedMonthView';
import { PathNotFoundError } from '../general/ErrorView';
import { ShortcutsPage } from '../general/ShortcutsPage';
import { GroupingExpensesPage } from '../grouping/GroupingExpensesPage';
import { GroupingPage } from '../grouping/GroupingPage';
import { InfoView } from '../info/InfoView';
import { ProfileView } from '../profile/ProfileView';
import { SearchPage } from '../search/SearchPage';
import { StatisticsView } from '../statistics/StatisticsView';
import { SubscriptionsPage } from '../subscriptions/SubscriptionsPage';
import { ToolsView } from '../tools/ToolsView';
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
      <Route
        path={trackingPagePath}
        element={
          <QueryBoundary>
            <TrackingPage />
          </QueryBoundary>
        }
      />
      <Route path={groupingsPagePath} element={<GroupingPage />} />
      <Route path={`${groupingsPagePath}/:groupingId`} element={<GroupingExpensesPage />} />
      <Route path={toolsPagePath} element={<ToolsView />} />
      <Route path={'/p/*'} element={<FrontpageView />} />
      <Route path="/" element={<FrontpageView />} />
      <Route element={<PathNotFoundError />} />
    </Routes>
  );
}
